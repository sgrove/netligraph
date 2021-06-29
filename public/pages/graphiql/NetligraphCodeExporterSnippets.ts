// @ts-ignore: No typescript defs
import capitalizeFirstLetter from '@sgrove/graphiql-code-exporter/lib/utils/capitalizeFirstLetter'
// @ts-ignore: No typescript defs
import commentsFactory from '@sgrove/graphiql-code-exporter/lib/utils/jsCommentsFactory'
import {
  isOperationNamed,
  collapseExtraNewlines,
  addLeftWhitespace,
  // @ts-ignore: No typescript defs
} from '@sgrove/graphiql-code-exporter/lib/utils/index'

import 'codemirror/mode/javascript/javascript'
import {
  getNamedType,
  OperationTypeNode,
  typeFromAST,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  VariableDefinitionNode,
  TypeNode,
  print,
} from 'graphql'

type Variables = { [key: string]: any }

type OperationData = {
  query: string
  name: string
  displayName: string
  type: OperationTypeNode | 'fragment'
  variableName: string
  variables: Variables
  operationDefinition: OperationDefinitionNode | FragmentDefinitionNode
  fragmentDependencies: Array<FragmentDefinitionNode>
}

type OptionValues = { [id: string]: boolean }

type Options = Array<{ id: string; label: string; initial: boolean }>

type GenerateOptions = {
  serverUrl: string
  headers: { [name: string]: string }
  context: Object
  operationDataList: Array<OperationData>
  options: OptionValues
}

type Snippet = {
  options: Options
  language: string
  codeMirrorMode: string
  name: string
  generate: (options: GenerateOptions) => string
}

const snippetOptions = [
  {
    id: 'postHttpMethod',
    label: 'POST function',
    initial: true,
  },
  {
    id: 'useClientAuth',
    label: "Use user's OAuth token",
    initial: false,
  },
]

const comments = {
  setup: `This setup is only needed once per application`,
  nodeFetch: `Node doesn't implement fetch so we have to import it`,
  graphqlError: `handle those errors like a pro`,
  graphqlData: `do something great with this precious data`,
  fetchError: `handle errors from fetch itself`,
}

function generateDocumentQuery(
  operationDataList: Array<OperationData>
): string {
  const body = operationDataList
    .map((operationData) => operationData.query)
    .join('\n\n')
    .trim()

  return `const operationsDoc = \`
${addLeftWhitespace(body, 2)}
\`;`
}

const fetcherName = 'fetchGraphQL'

function operationFunctionName(operationData: OperationData) {
  const { type } = operationData

  const prefix =
    type === 'query'
      ? 'fetch'
      : type === 'mutation'
      ? 'execute'
      : type === 'subscription'
      ? 'subscribeTo'
      : ''

  const fnName =
    prefix +
    (prefix.length > 0
      ? capitalizeFirstLetter(operationData.name)
      : operationData.name)

  return fnName
}

// Promise-based functions
function promiseFetcher(serverUrl: string, headers: string): string {
  return `function ${fetcherName}(operationsDoc, operationName, variables) {
  return fetch(
    "${serverUrl}",
    {
      method: "POST",${
        headers
          ? `
      headers: {
${addLeftWhitespace(headers, 8)}
      },`
          : ''
      }
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  ).then((result) => result.json());
}`
}

// TODO: Handle referenced fragments
function fetcherFunctions(
  operationDataList: Array<OperationData>,
  useClientAuth: boolean
): string {
  return operationDataList
    .filter((operationData) => {
      return ['query', 'mutation', 'subscription'].includes(operationData.type)
    })
    .map((operationData) => {
      const fnName = operationFunctionName(operationData)
      const params = (
        operationData.operationDefinition.variableDefinitions || []
      ).map((def) => def.variable.name.value)
      const variablesBody = params
        .map((param) => `"${param}": ${param}`)
        .join(', ')
      const variables = `{${variablesBody}}`

      const clientAuth = `,
    accessToken: netligraph.accessToken`

      return `function ${fnName}(netligraph, {${params.join(', ')}}) {
  return netligraph.graph.send({
    query: \`
${addLeftWhitespace(operationData.query, 6)}\`,
    operationName: '${operationData?.name}',
    variables: ${variables}${clientAuth}
  });
}`
    })
    .join('\n\n')
}

// Async-await-based functions
function asyncFetcher(serverUrl: string, headers: string): string {
  return `async function ${fetcherName}(operationsDoc, operationName, variables) {
  const result = await fetch(
    "${serverUrl}",
    {
      method: "POST",${
        headers
          ? `
      headers: {
${addLeftWhitespace(headers, 8)}
      },`
          : ''
      }
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  );

  return await result.json();
}`
}

const coercerFor = (type: TypeNode, name: string): string => {
  const typeName = print(type).replace(/\W+/gi, '').toLocaleLowerCase()

  switch (typeName) {
    case 'string':
      return `${name}`
    case 'int':
      return `parseInt(${name})`
    case 'float':
      return `parseFloat(${name})`
    case 'boolean':
      return `${name} === 'true'`
    default:
      return `${name}`
  }
}

function asyncFetcherInvocation(
  operationDataList: Array<OperationData>,
  vars: any,
  pluckerStyle: 'get' | 'post',
  useClientAuth: boolean
): string {
  const netligraphClientName = useClientAuth ? 'netligraphClient' : 'netligraph'

  return operationDataList
    .filter((operationData) => {
      return ['query', 'mutation', 'subscription'].includes(operationData.type)
    })
    .map((namedOperationData) => {
      const params = (
        namedOperationData.operationDefinition.variableDefinitions || []
      ).map((def) => def.variable.name.value)
      const variables = Object.entries(namedOperationData.variables || {}).map(
        ([key, value]) => `const ${key} = ${JSON.stringify(value, null, 2)};`
      )
      const pluckers = {
        get:
          namedOperationData.operationDefinition.variableDefinitions
            ?.map((def) => {
              const name = def.variable.name.value
              const withCoercer = coercerFor(
                def.type,
                `event.queryStringParameters?.${name}`
              )
              return `const ${name} = ${withCoercer}`
            })
            ?.join('\n  ') || '',
        post:
          namedOperationData.operationDefinition.variableDefinitions
            ?.map((def) => {
              const name = def.variable.name.value
              return `const ${name} = eventBodyJson?.${name}`
            })
            .join('\n  ') || '',
      }

      let variableValidation = ''

      if (
        !!namedOperationData.operationDefinition.variableDefinitions &&
        (namedOperationData.operationDefinition.variableDefinitions?.length ||
          0) > 0
      ) {
        const variableNames =
          namedOperationData.operationDefinition.variableDefinitions.map(
            (def) => def.variable.name.value
          )

        // TODO: Handle booleans and filter nullable variables
        const condition = variableNames.map((name) => '!' + name).join(' || ')

        const message = variableNames.map((name) => `\`${name}\``).join(', ')

        variableValidation = `  if (${condition}) {
    return {
      statusCode: 422,
      body: JSON.stringify({error: 'You must supply parameters for: ${message}'}),
    }
  }`
      }

      return `${pluckerStyle === 'get' ? pluckers.get : pluckers.post}

${variableValidation}

  const { errors: ${namedOperationData.name}Errors, data: ${
        namedOperationData.name
      }Data } = await ${operationFunctionName(
        namedOperationData
      )}(netligraph, {${params.join(', ')}});

  if (${namedOperationData.name}Errors) {
    console.error(${namedOperationData.name}Errors);
  }

  console.log(${namedOperationData.name}Data);`
    })
    .join('\n\n')
}

function clientSideInvocations(
  operationDataList: Array<OperationData>,
  vars: any,
  pluckerStyle: 'get' | 'post',
  useClientAuth: boolean
): string {
  return operationDataList
    .filter((operationData) => {
      return ['query', 'mutation', 'subscription'].includes(operationData.type)
    })
    .map((namedOperationData) => {
      const params = (
        namedOperationData.operationDefinition.variableDefinitions || []
      ).map((def) => def.variable.name.value)
      let bodyPayload = ''

      if (
        !!namedOperationData.operationDefinition.variableDefinitions &&
        (namedOperationData.operationDefinition.variableDefinitions?.length ||
          0) > 0
      ) {
        const variableNames =
          namedOperationData.operationDefinition.variableDefinitions.map(
            (def) => def.variable.name.value
          )

        const variables = variableNames
          .map((name) => `"${name}": ${name}`)
          .join(',\n')

        bodyPayload = `
${variables}
`
      }

      const clientAuth = useClientAuth
        ? `,
      headers: {
        ...oneGraphAuth?.authHeaders()
      }`
        : ''

      return `async function ${operationFunctionName(namedOperationData)}(${
        useClientAuth ? 'oneGraphAuth, ' : ''
      }params) {
  const {${params.join(', ')}} = params || {};
  const resp = await fetch("/.netlify/functions/${namedOperationData.name}",
    {
      method: "${pluckerStyle.toLocaleUpperCase()}",
      body: JSON.stringify({${addLeftWhitespace(
        bodyPayload,
        8
      ).trim()}})${clientAuth}
    });

    const text = await resp.text();

    return JSON.parse(text);
}`
    })
    .join('\n\n')
}

// Snippet generation!
export const netlifyFunctionSnippet: Snippet = {
  language: 'JavaScript',
  codeMirrorMode: 'javascript',
  name: 'Netlify Function',
  options: snippetOptions,
  generate: (opts) => {
    const { serverUrl, headers, options } = opts

    const operationDataList = opts.operationDataList.map(
      (operationData, idx) => {
        if (!isOperationNamed(operationData)) {
          return {
            ...operationData,
            name: `unnamed${capitalizeFirstLetter(operationData.type)}${
              idx + 1
            }`.trim(),
            query:
              `# Consider giving this ${
                operationData.type
              } a unique, descriptive
# name in your application as a best practice
${operationData.type} unnamed${capitalizeFirstLetter(operationData.type)}${
                idx + 1
              } ` +
              operationData.query
                .trim()
                .replace(/^(query|mutation|subscription) /i, ''),
          }
        } else {
          return operationData
        }
      }
    )

    const firstOperation = operationDataList[0]

    const graphqlQuery = generateDocumentQuery(operationDataList)
    const vars = JSON.stringify({}, null, 2)
    const headersValues = []
    for (const header of Object.keys(headers)) {
      if (header && headers[header]) {
        headersValues.push(`"${header}": "${headers[header]}"`)
      }
    }

    const fetcherFunctionsDefs = fetcherFunctions(
      operationDataList,
      options.useClientAuth
    )

    const fetcherInvocation = asyncFetcherInvocation(
      operationDataList,
      vars,
      options?.postHttpMethod === true ? 'post' : 'get',
      options.useClientAuth
    )

    const filename = `${firstOperation.name}.js`

    const netligraphClientName = options.useClientAuth
      ? 'netligraphClient'
      : 'netligraph'
    const netligraphClient = options.useClientAuth
      ? `
  // Use the incoming authorization header when making API calls on the user's behalf
  const accessToken = event.headers["authorization"]?.split(" ")[1]
  const netligraph = { ...${netligraphClientName}, accessToken: accessToken }

`
      : ''

    const passThroughResults = operationDataList
      .filter((operationData) => {
        return ['query', 'mutation', 'subscription'].includes(
          operationData.type
        )
      })
      .map((operationData) => {
        return `${operationData.name}Errors: ${operationData.name}Errors,
${operationData.name}Data: ${operationData.name}Data`
      })
      .join(',\n')

    const clientSideCalls = clientSideInvocations(
      operationDataList,
      vars,
      options?.postHttpMethod === true ? 'post' : 'get',
      options.useClientAuth
    )

    const snippet = `/** Netlify serverless function:
Save this snippet in \`netlify/functions/${filename}\`
*/
import { withGraph } from './NetligraphHandler'

${fetcherFunctionsDefs}

export const handler = withGraph(async (event, { ${
      options.useClientAuth ? 'netligraph: ' : ''
    }${netligraphClientName}  }) => {
  if (!${netligraphClientName}) {
    return {
      statusCode: 400,
      body: 'Please enable your netligraph integration',
    }
  }
  ${netligraphClient}
  const eventBodyJson = JSON.parse(event.body || "{}");

  ${fetcherInvocation}

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
${addLeftWhitespace(passThroughResults, 6)}
    }),
    headers: {
      'content-type': 'application/json',
    },
  }
})

/** 
 * Client-side invocations:
 * Call your Netlify function from the browser (after saving
 * the code to \`${filename}\`) with these helpers:
 */

/**
${clientSideCalls}
*/
`

    return collapseExtraNewlines(snippet.trim())
  },
}
