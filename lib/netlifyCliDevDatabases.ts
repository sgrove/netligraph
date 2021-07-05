import * as fs from 'fs'
import { DefinitionNode, parse } from 'graphql'
import { GraphQLSchema } from 'graphql'
import { notEmpty } from './utils'
import { gatherVariableDefinitions } from './graphqlHelpers'

/**
 * Simulate the values that Netlify would store in a full integration:
 * 1. List of enabled services
 * 2. OneGraph access token
 * 3. Services accessible via the access token we have
 * 4. The ids of the enabled community functions
 */

export type Database = {
  accessToken: string | null
  manuallyEnabledServices: Array<string>
  loggedInServices: Array<string>
  serviceBearerTokens: Record<string, string | null>
  installedFunctionIds: Array<string>
}

const databaseFilename = 'tmp/database.json'

export const writeDatabase = (fullDatabase: Database) => {
  fs.writeFileSync(databaseFilename, JSON.stringify(fullDatabase, null, 2))
}

export const readDatabase = (): Database => {
  try {
    const database = fs.readFileSync(databaseFilename).toString()
    return JSON.parse(database)
  } catch {
    return {
      accessToken: null,
      manuallyEnabledServices: [],
      loggedInServices: [],
      serviceBearerTokens: {},
      installedFunctionIds: [],
    }
  }
}

/**
 * Community functions mocking
 */

export type SerializedCommunityFunction = {
  id: string
  definition: string
  description: string
}

export const communityFunctionsDatabaseFilename = 'tmp/communityFunctions.json'

export const writeCommunityFunctionsDatabase = (
  fullDatabase: Array<SerializedCommunityFunction>
) => {
  fs.writeFileSync(
    communityFunctionsDatabaseFilename,
    JSON.stringify(fullDatabase, null, 2)
  )
}

export const readCommunityFunctionsDatabase =
  (): Array<SerializedCommunityFunction> => {
    try {
      const database = fs
        .readFileSync(communityFunctionsDatabaseFilename)
        .toString()
      return JSON.parse(database)
    } catch {
      return []
    }
  }

export type CommunityFunction = {
  id: string
  definition: string
  description: string
  name: string
  variables: Array<[string, string]>
}

export const hydrateCommunityFunctionsDatabase = async (
  schema: GraphQLSchema
): Promise<Array<CommunityFunction>> => {
  const communityFunctions: Array<SerializedCommunityFunction> =
    readCommunityFunctionsDatabase()

  return communityFunctions
    .map((fn) => {
      const parsed = parse(fn.definition)
      const operation: DefinitionNode | undefined = parsed.definitions.find(
        (definition) => definition.kind === 'OperationDefinition'
      )

      if (!operation || operation.kind !== 'OperationDefinition') {
        return
      }

      const name = operation.name?.value || 'Unknown'
      const variables = gatherVariableDefinitions(operation)

      return { ...fn, variables, name }
    })
    .filter(notEmpty)
}

export const serviceEnabled = (database: Database, service: string) => {
  const safeService = service.toLocaleUpperCase()
  return (
    database.loggedInServices.includes(safeService) ||
    database.manuallyEnabledServices.includes(safeService)
  )
}
