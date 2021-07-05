import { fetchFullSchema } from '../netlify/functions/netligraphMeta'
import { buildASTSchema, parse } from 'graphql'
import {
  typeScriptSignatureForOperation,
  typeScriptSignatureForOperationVariables,
} from './graphQLHelpers'
import { OperationDefinitionNode } from 'graphql'
import { FragmentDefinitionNode } from 'graphql'
import * as fs from 'fs'
import { hydrateCommunityFunctionsDatabase } from './netlifyCliDevDatabases'
import * as Prettier from 'prettier'

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
    )

    if (!operations) {
      return ''
    }

    const operation = operations[0] as OperationDefinitionNode

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
      const jsDoc = (fn.description || '')
        .replaceAll('*/', '')
        .split('\n')
        .join('\n* ')

      return `/**
  * ${jsDoc}
  */
    ${fn.name}:${fn.name}`
    })
    .join(',\n  ')

  const source = `// GENERATED VIA \`netlify-cli dev\`, EDIT WITH CAUTION!
import { fetchOneGraph } from "../netlify/functions/netligraph"
  
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
