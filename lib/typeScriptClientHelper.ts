import { fetchFullSchema } from '../netlify/functions/netligraphMeta'
import {
  buildASTSchema,
  parse,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  print,
} from 'graphql'
import {
  patchSubscriptionWebhookField,
  patchSubscriptionWebhookSecretField,
  typeScriptSignatureForOperation,
  typeScriptSignatureForOperationVariables,
} from './graphQLHelpers'
import * as fs from 'fs'
import {
  CommunityFunction,
  hydrateCommunityFunctionsDatabase,
} from './netlifyCliDevDatabases'
import * as Prettier from 'prettier'
import { GraphQLSchema } from 'graphql'

const subscriptionParserName = (fn: CommunityFunction): string => {
  return `parseAndVerify${fn.name}`
}

const subscriptionFunctionName = (fn: CommunityFunction): string => {
  return `subscribeTo${fn.name}`
}

const generateSubscriptionFunction = (
  fullSchema: GraphQLSchema,
  operation: OperationDefinitionNode,
  fragments: Array<FragmentDefinitionNode>,
  fn: CommunityFunction
): string => {
  const patchedWithWebhookUrl = patchSubscriptionWebhookField({
    schema: fullSchema,
    definition: operation,
  })

  const patched = patchSubscriptionWebhookSecretField({
    schema: fullSchema,
    definition: patchedWithWebhookUrl,
  })

  // TODO: Don't allow unnamed operations as subscription
  const filename = patched.name?.value || 'Unknown'

  const body = print(patched)
  const safeBody = body.replaceAll('${', '\\${')

  const parsingFunctionReturnSignature = typeScriptSignatureForOperation(
    fullSchema,
    operation,
    fragments as Array<FragmentDefinitionNode>
  )

  const variableNames = (operation.variableDefinitions || []).map(
    (varDef) => varDef.variable.name.value
  )

  const variableSignature = typeScriptSignatureForOperationVariables(
    variableNames,
    fullSchema,
    operation
  )

  return `const ${subscriptionFunctionName(fn)} = (
    /**
     * This will be available in your webhook handler as a query parameter.
     * Use this to keep track of which subscription you're receiving
     * events for.
     */
    netligraphWebhookId: string,
    variables: ${variableSignature},
    accessToken?: string | null
    ) : void => {
      const netligraphWebhookUrl = \`\${process.env.DEPLOY_URL}/.netlify/functions/${filename}?netligraphWebhookId=\${netligraphWebhookId}\`
      const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET

      fetchOneGraph({
      query: \`${safeBody}\`,
      variables: {...variables, netligraphWebhookUrl: netligraphWebhookUrl, netligraphWebhookSecret: { hmacSha256Key: secret }},
      accessToken: accessToken
    })
  }

const ${subscriptionParserName(
    fn
  )} = (event: HandlerEvent) : null | ${parsingFunctionReturnSignature} => {
  if (!verifyRequestSignature({ event: event })) {
    console.warn("Unable to verify signature for ${filename}")
    return null
  }
  
  return JSON.parse(event.body || '{}')
}`
}

export const generateTypeScriptClient = async (
  installedFunctionIds: Array<string>
) => {
  const schemaSdl = await fetchFullSchema()
  const fullSchema = buildASTSchema(parse(schemaSdl))
  const hydratedFunctions = await hydrateCommunityFunctionsDatabase(fullSchema)

  const enabledFunctions = hydratedFunctions.filter((fn) =>
    installedFunctionIds.includes(fn.id)
  )

  const functionDecls = enabledFunctions.map((fn) => {
    const body = fn.definition
    const safeBody = body.replaceAll('${', '\\${')

    const parsed = parse(body)
    const operations = parsed.definitions.filter(
      (def) => def.kind === 'OperationDefinition'
    )
    const fragments = parsed.definitions.filter(
      (def) => def.kind === 'FragmentDefinition'
    ) as Array<FragmentDefinitionNode>

    if (!operations) {
      return ''
    }

    const operation = operations[0] as OperationDefinitionNode

    if (operation.operation === 'subscription') {
      return generateSubscriptionFunction(fullSchema, operation, fragments, fn)
    }

    const returnSignature = typeScriptSignatureForOperation(
      fullSchema,
      operation,
      fragments as Array<FragmentDefinitionNode>
    )

    const variableNames = (operation.variableDefinitions || []).map(
      (varDef) => varDef.variable.name.value
    )

    const variableSignature = typeScriptSignatureForOperationVariables(
      variableNames,
      fullSchema,
      operation
    )

    return `const ${fn.name} = (
      variables: ${variableSignature},
      accessToken?: string | null
      ) : Promise<${returnSignature}>=> {
      return fetchOneGraph({
        query: \`${safeBody}\`,
        variables: variables,
        accessToken: accessToken
      })
    }
  `
  })

  const exportedFunctionsObjectProperties = enabledFunctions
    .map((fn) => {
      const body = fn.definition

      const parsed = parse(body)
      const operations = parsed.definitions.filter(
        (def) => def.kind === 'OperationDefinition'
      )

      const operation = (operations || [])[0] as OperationDefinitionNode

      if (!operation) {
        return ''
      }

      const isSubscription = operation.operation === 'subscription'

      if (isSubscription) {
        const subscriptionFnName = subscriptionFunctionName(fn)
        const parserFnName = subscriptionParserName(fn)

        const jsDoc = (fn.description || '')
          .replaceAll('*/', '')
          .split('\n')
          .join('\n* ')

        return `/**
        * ${jsDoc}
        */
          ${subscriptionFnName}:${subscriptionFnName},
        /**
         * Verify the event body is signed securely, and then parse the result.
         */
        ${parserFnName}:${parserFnName}`
      } else {
        const jsDoc = (fn.description || '')
          .replaceAll('*/', '')
          .split('\n')
          .join('\n* ')

        return `/**
        * ${jsDoc}
        */
          ${fn.name}:${fn.name}`
      }
    })
    .join(',\n  ')

  const source = `// GENERATED VIA \`netlify-cli dev\`, EDIT WITH CAUTION!
import { HandlerEvent } from '@netlify/functions'
import { fetchOneGraph, verifySignature } from "./netligraph"

export const verifyRequestSignature = ({ event }: { event: HandlerEvent }) => {
  const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET
  const signature = event.headers['x-onegraph-signature']
  const body = event.body

  if (!secret) {
    console.error(
      'NETLIGRAPH_WEBHOOK_SECRET is not set, cannot verify incoming webhook request'
    )
    return false
  }

  return verifySignature({ secret, signature, body: body || '' })
}

  ${functionDecls.join('\n\n')}
  
  const functions = {
    ${exportedFunctionsObjectProperties}
  }
    
  export default functions
  `

  const formatted = Prettier.format(source, {
    tabWidth: 2,
    semi: false,
    singleQuote: true,
    parser: 'babel-ts',
  })

  return formatted
}

export const writeTypeScriptClient = (source: string) => {
  fs.writeFileSync('lib/netligraphCommunityFunctions.ts', source)
}
