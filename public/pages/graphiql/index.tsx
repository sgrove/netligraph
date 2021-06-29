// @ts-ignore: it's css.
import styles from './style.module.css'
import GraphiQL from 'graphiql'
import 'graphiql/graphiql.css'
// @ts-ignore: No typescript defs
import OneGraphAuth from 'onegraph-auth'
// @ts-ignore: No typescript defs
import GraphiQLExplorer from 'graphiql-explorer'
import React from 'react'
import { parse, GraphQLSchema, buildASTSchema } from 'graphql'
// @ts-ignore: No typescript defs
import CodeExporter from '@sgrove/graphiql-code-exporter'
// @ts-ignore: it's css.
import '@sgrove/graphiql-code-exporter/CodeExporter.css'
// @ts-ignore: No typescript defs
import { netlifyFunctionSnippet } from './NetligraphCodeExporterSnippets'
import { Database } from '../home'
import {
  fetchIntegrationStatus,
  saveNetlifyFunctions,
} from '../../frontendHelpers'

type GraphQLRequest = {
  query: string
  operationName?: string
  doc_id?: string
  variables?: any
}
const schemaPath = '/.netlify/functions/netligraphMeta'

async function fetchSchema() {
  const response = await fetch(schemaPath, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  const responseBody = await response.text()

  try {
    return JSON.parse(responseBody)
  } catch (e) {
    console.warn(e)
    return responseBody
  }
}

async function fetcher(auth: any, params: GraphQLRequest) {
  const response = await fetch('/graph', {
    method: 'POST',
    headers: {
      ...auth?.authHeaders(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  const responseBody = await response.text()

  try {
    return JSON.parse(responseBody)
  } catch (e) {
    return responseBody
  }
}

const DEFAULT_QUERY = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields

# Be sure to enable the npm and GitHub integrations for this query
query npmPackage($name: String!) {
  npm {
    package(name: $name) {
      name
      homepage
      downloads {
        lastMonth {
          count
        }
      }
      repository {
        sourceRepository {
          ... on GitHubRepository {
            id
            name
            description
          }
        }
      }
    }
  }
}`

type GraphiQLState = {
  explorerIsOpen: boolean
  codeExporterIsOpen: boolean
  query: string
  oneGraphAuth: any
}

type GraphiQLComponentProps = {
  schema: GraphQLSchema
  query: string
}

const oneGraphAuth = new OneGraphAuth({
  appId: process.env.ONEGRAPH_APP_ID,
})

const GraphiQLComponent = ({ schema, query }: GraphiQLComponentProps) => {
  const [state, setState] = React.useState<GraphiQLState>({
    explorerIsOpen: false,
    codeExporterIsOpen: true,
    query: query,
    oneGraphAuth: oneGraphAuth,
  })

  React.useEffect(() => {
    // Bit of a hacky way to force GraphiQL to use the logged-in auth already.
    // Can be cleaned up in the next phase.
    fetchIntegrationStatus().then((database: Database) => {
      if (state.oneGraphAuth._accessToken) {
        state.oneGraphAuth._accessToken.accessToken = database.accessToken
      }

      state.oneGraphAuth._accessToken = { accessToken: database.accessToken }
    })
  }, [])

  const _graphiql = React.useRef<GraphiQL>(null)

  const _handleInspectOperation = (
    cm: any,
    mousePos: { line: Number; ch: Number }
  ) => {
    const parsedQuery = parse(state.query || '')

    if (!parsedQuery) {
      console.error("Couldn't parse query document")
      return null
    }

    var token = cm.getTokenAt(mousePos)
    var start = { line: mousePos.line, ch: token.start }
    var end = { line: mousePos.line, ch: token.end }
    var relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end),
    }

    var position = relevantMousePos

    var def = parsedQuery.definitions.find((definition) => {
      if (!definition.loc) {
        console.warn('Missing location information for definition')
        return false
      }

      const { start, end } = definition.loc
      return start <= position.start && end >= position.end
    })

    if (!def) {
      console.error('Unable to find definition corresponding to mouse position')
      return null
    }

    var operationKind =
      def.kind === 'OperationDefinition'
        ? def.operation
        : def.kind === 'FragmentDefinition'
        ? 'fragment'
        : 'unknown'

    var operationName =
      def.kind === 'OperationDefinition' && !!def.name
        ? def.name.value
        : def.kind === 'FragmentDefinition' && !!def.name
        ? def.name.value
        : 'unknown'

    var selector = `.graphiql-explorer-root #${operationKind}-${operationName}`

    var el = document.querySelector(selector)
    el && el.scrollIntoView()
  }

  React.useEffect(() => {
    const editor = _graphiql.current?.getQueryEditor()
    if (!editor) {
      return
    }

    editor.setOption('extraKeys', {
      // @ts-ignore: Unreachable code error
      ...(editor.options.extraKeys || {}),
      'Shift-Alt-LeftClick': _handleInspectOperation,
    })
  }, [_graphiql.current])

  const _handleToggleExplorer = () => {
    setState((oldState) => ({
      ...oldState,
      explorerIsOpen: !state.explorerIsOpen,
    }))
  }

  const _handleToggleCodeExporter = () => {
    setState((oldState) => ({
      ...oldState,
      codeExporterIsOpen: !state.codeExporterIsOpen,
    }))
  }
  const _handleEditQuery = (query?: string | undefined): void =>
    setState((oldState) => ({ ...oldState, query: query || '' }))

  const codeExporter = state.codeExporterIsOpen ? (
    <CodeExporter
      hideCodeExporter={_handleToggleCodeExporter}
      snippets={[netlifyFunctionSnippet]}
      serverUrl={'/graph'}
      context={{
        appId: '/* APP_ID */',
      }}
      headers={{
        Authorization: 'Bearer ',
      }}
      query={state.query}
      // Optional if you want to use a custom theme
      codeMirrorTheme="neo"
    />
  ) : null

  // Another hack to make the demo even slicker
  const _handleSaveNetlifyFunctions = async () => {
    const codeMirror = document.querySelector(
      '.graphiql-code-exporter .CodeMirror'
    )
    if (!codeMirror) {
      return
    }

    // @ts-ignore: I think innerText is a thing.
    const source = codeMirror.innerText

    if (!source || !source.trim()) {
      return
    }

    try {
      const parsed = parse(state.query)
      const functionName = parsed.definitions.find(
        (operation) => {
          return operation.kind === 'OperationDefinition'
        }
        // @ts-ignore: demo time
      )?.name?.value

      if (source && functionName) {
        const result = saveNetlifyFunctions([
          {
            functionName: functionName,
            source: source,
          },
        ])

        console.debug('Result of saving netlify function: ', result)
      }
    } catch (e) {
      console.error('Error parsing GraphQL doc and saving function: ', e)
    }
  }

  return (
    <div
      className="graphiql-container"
      style={{ height: '100vh', width: '100%' }}
    >
      <GraphiQLExplorer
        schema={schema}
        query={state.query}
        onEdit={_handleEditQuery}
        onRunOperation={(operationName: string) =>
          _graphiql.current?.handleRunQuery(operationName)
        }
        explorerIsOpen={state.explorerIsOpen}
        onToggleExplorer={_handleToggleExplorer}
      />
      <GraphiQL
        ref={_graphiql}
        fetcher={(params) => fetcher(state.oneGraphAuth, params)}
        schema={schema}
        query={state.query}
        onEditQuery={_handleEditQuery}
      >
        <GraphiQL.Toolbar>
          <GraphiQL.Button
            onClick={() => _graphiql.current?.handlePrettifyQuery()}
            label="Prettify"
            title="Prettify Query (Shift-Ctrl-P)"
          />
          <GraphiQL.Button
            onClick={() => _graphiql.current?.handleToggleHistory()}
            label="History"
            title="Show History"
          />
          <GraphiQL.Button
            onClick={_handleToggleExplorer}
            label="Explorer"
            title="Toggle Explorer"
          />
          <GraphiQL.Button
            onClick={_handleToggleCodeExporter}
            label="Code Exporter"
            title="Toggle Code Exporter"
          />
          {state.codeExporterIsOpen ? (
            <GraphiQL.Button
              onClick={_handleSaveNetlifyFunctions}
              label="Save Netlify function"
              title="Toggle Code Exporter"
            />
          ) : null}
        </GraphiQL.Toolbar>
      </GraphiQL>
      {codeExporter}
    </div>
  )
}

const Component = () => {
  const [schema, setSchema] = React.useState<GraphQLSchema | null>(() => null)

  React.useEffect(() => {
    fetchSchema().then((result) => {
      if (!result.schema) {
        return
      }

      const sdlSchema = buildASTSchema(parse(result.schema))

      setSchema(() => sdlSchema)
    })
  }, [])

  return (
    <section className={styles.about}>
      <div>
        {!schema ? (
          'Loading....'
        ) : (
          <GraphiQLComponent schema={schema} query={DEFAULT_QUERY} />
        )}
      </div>
    </section>
  )
}

export default Component
