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
import { netlifyFunctionSnippet } from './netligraphCodeExporterSnippets'
import { CommunityFunction, Database } from '../home'
import {
  editFunctionLibrary,
  fetchCommunityFunctions,
  fetchIntegrationStatus,
  fetchSchemas,
  graphqlFetcher,
  makeAuth,
  saveNetlifyFunctions,
} from '../../frontendHelpers'
import { OperationDefinitionNode } from 'graphql'
import { SerializedCommunityFunction } from '../../../lib/netlifyCliDevDatabases'

const DEFAULT_QUERY_ = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields

# Be sure to enable the npm and GitHub integrations for this query
query AsanaProjects($name: String!) {
  asana {
    projects {
      nodes {
        name
      }
    }
  }
}`

const DEFAULT_QUERY = `subscription IncomingGitHubComment($repoOwner: String!, $repoName: String!) {
  github {
    issueCommentEvent(input: {repoOwner: $repoOwner, repoName: $repoName}) {
      action
      comment {
        id
        body
      }
    }
  }
}
`

//@ts-ignore
window.testQuery = DEFAULT_QUERY

type GraphiQLState = {
  explorerIsOpen: boolean
  codeExporterIsOpen: boolean
  query: string
  oneGraphAuth: any
  communityFunctions: Array<CommunityFunction>
  installedFunctionIds: Array<string>
  selectedFunctionId: null | string
}

type GraphiQLComponentProps = {
  schema: GraphQLSchema
  query: string
}

const oneGraphAuth = makeAuth({
  appId: process.env.ONEGRAPH_APP_ID,
})

const GraphiQLComponent = ({ schema, query }: GraphiQLComponentProps) => {
  const [state, setState] = React.useState<GraphiQLState>({
    explorerIsOpen: false,
    codeExporterIsOpen: false,
    query: query,
    oneGraphAuth: oneGraphAuth,
    communityFunctions: [],
    installedFunctionIds: [],
    selectedFunctionId: null,
  })

  React.useEffect(() => {
    // Bit of a hacky way to force GraphiQL to use the logged-in auth already.
    // Can be cleaned up in the next phase.
    fetchIntegrationStatus().then((database: Database) => {
      if (state.oneGraphAuth._accessToken) {
        state.oneGraphAuth._accessToken.accessToken = database.accessToken
      }

      setState((oldState) => ({
        ...oldState,
        installedFunctionIds: database.installedFunctionIds,
      }))

      state.oneGraphAuth._accessToken = { accessToken: database.accessToken }
    })
  }, [])

  React.useEffect(() => {
    fetchSchemas()
      .then((result) => {
        if (!result.schema) {
          return
        }

        const sdlSchema = buildASTSchema(parse(result.fullSchema))
        const fullSchema = sdlSchema
        setState((oldState) => ({ ...oldState, fullSchema: sdlSchema }))

        return fetchCommunityFunctions(fullSchema)
      })
      .then((functions) => {
        setState((oldState) => ({
          ...oldState,
          communityFunctions: functions || [],
        }))
      })
  }, [])

  const _graphiql = React.useRef<GraphiQL>(null)

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
      query={state.query}
      codeMirrorTheme="neo"
      schema={schema}
    />
  ) : null

  /**
   * Save the current operation (state.query) as a Netlify
   * function with http handler and (primitive for the PoC)
   * variable coercion
   */
  const _handleSaveNetlifyFunctions = async () => {
    const codeMirror = document.querySelector(
      '.graphiql-code-exporter .CodeMirror'
    )
    if (!codeMirror) {
      return
    }

    // @ts-ignore: I think innerText is a thing.
    const source = codeMirror.innerText

    if (!source?.trim()) {
      return
    }

    try {
      const parsed = parse(state.query)
      const operation = parsed.definitions.find((operation) => {
        return operation.kind === 'OperationDefinition'
      })

      if (!operation || operation.kind !== 'OperationDefinition') {
        return
      }

      const isSubscription = operation.operation === 'subscription'

      const functionName = operation?.name?.value

      /**
       * If it's a subscription, we need to make sure the updated
       * netligraph client function is available
       */

      if (isSubscription) {
        // Push the current operation into the netligraph client library
        // so users can start new webhooks with it
        _handleSaveNetligraphLibraryFunction()
      }

      if (source && functionName) {
        saveNetlifyFunctions([
          {
            functionName: functionName,
            source: source,
          },
        ])
      }
    } catch (e) {
      console.error('Error parsing GraphQL doc and saving function: ', e)
    }
  }

  /**
   * Save the current operation (state.query) as a typescript
   * function that's available in Netlify functions under
   * netligraph.function.<functionName>
   */
  const _handleSaveNetligraphLibraryFunction = async () => {
    const parsedQuery = parse(state.query || '')

    if (!parsedQuery) {
      console.error("Couldn't parse query document")
      return null
    }

    // @ts-ignore
    const operation: OperationDefinitionNode | undefined =
      parsedQuery.definitions.find((op) => op.kind === 'OperationDefinition')

    if (!operation) {
      console.error("Couldn't find operation definition for function")
      return null
    }

    const username = 'sgrove'

    let newFunction: SerializedCommunityFunction

    const existingFunction = state.communityFunctions.find(
      (fn) => fn.id === state.selectedFunctionId
    )

    if (existingFunction) {
      newFunction = {
        id: existingFunction.id,
        definition: state.query,
        description: existingFunction.description,
      }
    } else {
      const name = operation.name?.value || 'unknown'

      newFunction = {
        id: `${username}/${name}`,
        definition: state.query,
        description: '',
      }
    }

    const description =
      prompt(
        'Docstring for new netligraph library function',
        existingFunction?.description
      ) || ''

    newFunction.description = description

    editFunctionLibrary(newFunction)

    setState((oldState) => ({
      ...oldState,
      installedFunctionIds: [
        ...oldState.installedFunctionIds,
        newFunction.id,
      ].filter((v, i, a) => a.indexOf(v) === i),
      selectedFunctionId: newFunction.id,
    }))
  }

  const installedFunctions = state.communityFunctions.filter((fn) =>
    state.installedFunctionIds.includes(fn.id)
  )

  const libraryOptions =
    installedFunctions.length === 0 ? null : (
      <GraphiQL.Menu label="Your library" title="Your library">
        <GraphiQL.MenuItem
          key={'new'}
          label={'<new function>'}
          title={'Create new function'}
          onSelect={() => {
            setState((oldState) => ({
              ...oldState,
              selectedFunctionId: null,
              query: DEFAULT_QUERY,
            }))
          }}
        />

        {installedFunctions.map((fn) => {
          return (
            <GraphiQL.MenuItem
              key={fn.id}
              label={fn.name}
              title={'Edit ' + fn.name}
              onSelect={() => {
                setState((oldState) => ({
                  ...oldState,
                  selectedFunctionId: fn.id,
                  query: fn.definition,
                }))
              }}
            />
          )
        })}
      </GraphiQL.Menu>
    )

  let parsedQuery

  try {
    parsedQuery = parse(state.query)
  } catch (e) {
    console.error(e)
  }

  const saveFunctionButton = parsedQuery ? (
    <GraphiQL.Button
      onClick={() => _handleSaveNetligraphLibraryFunction()}
      label={state.selectedFunctionId ? 'Update function' : 'Create function'}
      title={
        state.selectedFunctionId
          ? 'Update this function in your netligraph client'
          : 'Add a new function to your netligraph client'
      }
    />
  ) : null

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
        fetcher={(params) => graphqlFetcher(state.oneGraphAuth, params)}
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
          {state.codeExporterIsOpen ? (
            <GraphiQL.Button
              onClick={_handleSaveNetlifyFunctions}
              label="Save Netlify function"
              title="Toggle Code Exporter"
            />
          ) : null}
          <GraphiQL.Button
            onClick={_handleToggleCodeExporter}
            label="Code Exporter"
            title="Toggle Code Exporter"
          />
          {libraryOptions}
          {saveFunctionButton}
        </GraphiQL.Toolbar>
      </GraphiQL>
      {codeExporter}
    </div>
  )
}

const Component = () => {
  const [schema, setSchema] = React.useState<GraphQLSchema | null>(() => null)

  React.useEffect(() => {
    fetchSchemas().then((result) => {
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
