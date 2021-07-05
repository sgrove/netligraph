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
import * as GraphQL from 'graphql'
import {
  GraphQLSchema,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  TypeNode,
  OperationTypeNode,
} from 'graphql'

const { print } = GraphQL

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
  schema: GraphQLSchema
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

// TODO: Handle referenced fragments
function fetcherFunctions(
  schema: GraphQLSchema,
  operationDataList: Array<OperationData>
): string {
  return operationDataList
    .filter((operationData) => {
      return ['query', 'mutation', 'subscription'].includes(operationData.type)
    })
    .map((rawOperationData) => {
      const isSubscription = rawOperationData.type === 'subscription'

      const operationData = rawOperationData

      //@ts-ignore: Already filtered
      const fnName = operationFunctionName(operationData)
      const params = (
        rawOperationData.operationDefinition.variableDefinitions || []
      ).map((def) => def.variable.name.value)
      const variablesBody = params
        .map((param) => `"${param}": ${param}`)
        .join(', ')

      const webhookUrlVariable = isSubscription
        ? `, netligraphWebhookUrl: netligraphWebhookUrl`
        : ''

      const webhookIdParam = isSubscription ? ', webhookId' : ''

      const variables = `{${variablesBody}${webhookUrlVariable}}`
      //@ts-ignore: handle edge cases later
      const query = print(operationData.operationDefinition)
      const deployUrl = process.env.DEPLOY_URL || 'DEPLOY_URL'

      const filename = `${operationData.name}`

      const computeWebHookUrl = isSubscription
        ? `const netligraphWebhookUrl = \`\${process.env.DEPLOY_URL}/.netlify/functions/${filename}?webhookId=\${webhookId}\`
  `
        : ''

      const clientAuth = `,
    accessToken: netligraph.accessToken`

      return `export function ${fnName}(netligraph, {${params.join(
        ', '
      )}${webhookIdParam}}) {
  ${computeWebHookUrl}return netligraph.graph.send({
    query: \`
${addLeftWhitespace(query, 6)}\`,
    operationName: '${operationData?.name}',
    variables: ${variables}${clientAuth}
  });
}`
    })
    .join('\n\n')
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
  pluckerStyle: 'get' | 'post'
): string {
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

      let requiredVariableCount = 0

      if (
        !!namedOperationData.operationDefinition.variableDefinitions &&
        (namedOperationData.operationDefinition.variableDefinitions?.length ||
          0) > 0
      ) {
        const requiredVariableNames =
          namedOperationData.operationDefinition.variableDefinitions
            .map((def) =>
              print(def.type).endsWith('!') ? def.variable.name.value : null
            )
            .filter(Boolean)

        requiredVariableCount = requiredVariableNames.length

        // TODO: Filter nullable variables
        const condition = requiredVariableNames
          .map((name) => `${name} === undefined || ${name} === null`)
          .join(' || ')

        const message = requiredVariableNames
          .map((name) => `\`${name}\``)
          .join(', ')

        variableValidation = `  if (${condition}) {
    return {
      statusCode: 422,
      body: JSON.stringify({error: 'You must supply parameters for: ${message}'}),
    }
  }`
      }

      return `${pluckerStyle === 'get' ? pluckers.get : pluckers.post}

${requiredVariableCount > 0 ? variableValidation : ''}

  const { errors: ${namedOperationData.name}Errors, data: ${
        namedOperationData.name
      }Data } = await ${operationFunctionName(
        namedOperationData
      )}(netligraph, {${params.join(', ')}});

  if (${namedOperationData.name}Errors) {
    console.error(JSON.stringify(${namedOperationData.name}Errors, null, 2));
  }

  console.log(JSON.stringify(${namedOperationData.name}Data, null, 2));`
    })
    .join('\n\n')
}

function clientSideInvocations(
  operationDataList: Array<OperationData>,
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

const subscriptionHandler = ({
  filename,
  operationData,
}: {
  filename: string
  operationData: OperationData
}) => {
  return `/** Netlify serverless function:
Save this snippet in \`netlify/functions/${filename}\`
*/
import { withGraph } from './NetligraphHandler'
    
export const handler = withGraph(async (event, { netligraph }) => { 
  const payload =
  netligraph.functions.parseAndVerify${operationData.name}(event)

  if (!payload) {
    return {
      statusCode: 412,
      data: JSON.stringify({
        success: false,
        error: 'Unable to verify payload signature',
      }),
    }
  }
  const { errors: ${operationData.name}Errors, data: ${operationData.name}Data } = payload;

  if (${operationData.name}Errors) {
    console.error(${operationData.name}Errors);
  }

  console.log(${operationData.name}Data);

  /**
  * If you want to unsubscribe from this webhook
  * in order to stop receiving new events,
  * simply return status 410, e.g.:
  *
  * return {
  *   statusCode: 410,
  *   body: JSON.stringify(null),
  *   headers: {
  *     'content-type': 'application/json',
  *   },
  * }
  */

  return {
    statusCode: 200,
    body: JSON.stringify({
      successProcessedIncomingWebhook: true,
    }),
    headers: {
      'content-type': 'application/json',
    },
  }
})
`
}

// Snippet generation!
export const netlifyFunctionSnippet: Snippet = {
  language: 'JavaScript',
  codeMirrorMode: 'javascript',
  name: 'Netlify Function',
  options: snippetOptions,
  generate: (opts) => {
    const { headers, options } = opts

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

    const firstOperation = operationDataList.filter(
      (operation) =>
        operation.operationDefinition.kind === 'OperationDefinition'
    )[0]

    if (!firstOperation) {
      return '// No operation found'
    }

    const filename = `${firstOperation.name}.js`

    const isSubscription = firstOperation.type === 'subscription'

    if (isSubscription) {
      const result = subscriptionHandler({
        filename,
        operationData: firstOperation,
      })

      return result
    }

    const fetcherFunctionsDefs = fetcherFunctions(
      opts.schema,
      operationDataList
    )

    const fetcherInvocation = asyncFetcherInvocation(
      operationDataList,
      options?.postHttpMethod === true ? 'post' : 'get'
    )

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
