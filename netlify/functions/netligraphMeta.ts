/**
 * Handles filtering out the full GraphQL schema to only expose the subset
 * that's relevant for this specific app. Can be implemented on either Netlify
 * or OneGraph's side so that it's transparent with regards to performance
 * and DX
 */

import { fetchOneGraph } from '../../lib/netligraph'
import {
  buildClientSchema,
  getIntrospectionQuery,
  getNamedType,
  printSchema,
  GraphQLSchema,
  buildASTSchema,
  parse,
} from 'graphql'
import { withGraph } from './NetligraphHandler'
import * as fs from 'fs'
import { Database, readDatabase } from '../../lib/netlifyCliDevDatabases'
import { wrapSchema, FilterRootFields } from '@graphql-tools/wrap'

const builtInEnabled = ['query', 'mutation', 'subscription']
const forcedRemoveList = ['onegraphemailnode']

const shouldRetainNamed = (
  enabledServices: Array<string>,
  named: { name: string }
) => {
  const name = named.name.toLocaleLowerCase()
  if (forcedRemoveList.includes(name)) {
    return false
  }

  if (builtInEnabled.includes(name)) {
    return true
  }

  for (var i = 0; i < enabledServices.length; i++) {
    const service = enabledServices[i]
    if (name.startsWith(service)) {
      return true
    }
  }

  return false
}

const cachedFullSchema = `tmp/cache_full_schema.sdl`

export async function fetchFullSchema() {
  let fullSchema

  if (fs.existsSync(cachedFullSchema)) {
    fullSchema = fs.readFileSync(cachedFullSchema).toString()
    console.debug('Hit cached path for ', cachedFullSchema)
  } else {
    console.debug('No cache, refreshing ', cachedFullSchema)
    const schemaSource = await fetchOneGraph({
      query: getIntrospectionQuery(),
    })
    const originalSchema = buildClientSchema(schemaSource.data)
    fs.writeFileSync(cachedFullSchema, printSchema(originalSchema))
    fullSchema = printSchema(originalSchema)
  }

  return fullSchema
}

function pruneSchema(
  enabledServices: Array<string>,
  originalSchema: GraphQLSchema
) {
  const clientSchema = wrapSchema({
    schema: originalSchema,
    transforms: [
      new FilterRootFields((operationName, fieldName, fieldConfig) => {
        const namedType = !!fieldConfig?.type && getNamedType(fieldConfig.type)

        // Include at least one field per root object.
        // Not necessary for the final version, but fine for the
        // proof of concept
        if (
          !!fieldName &&
          ['poll', 'testMutate', 'oneGraph'].includes(fieldName)
        ) {
          return true
        }

        const include =
          namedType && shouldRetainNamed(enabledServices, namedType)

        return include
      }),
    ],
  })

  return printSchema(clientSchema)
}

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Please enable an integration for your Netlify app',
      }),
      headers: {
        'content-type': 'application/json',
      },
    }
  }

  const database: Database = readDatabase()
  const enabledServices: Array<string> = database.manuallyEnabledServices.map(
    (service) => service.toLocaleLowerCase().replace(/\W|_|-/g, '')
  )

  const cachedFile = `tmp/cache_schema_${enabledServices.join('_')}.sdl`

  let schema: string
  let fullSchema: string = await fetchFullSchema()

  if (fs.existsSync(cachedFile)) {
    schema = fs.readFileSync(cachedFile).toString()
    console.debug('Hit cached path for ', cachedFile)
  } else {
    console.debug('No cache, calculating schema for ', cachedFile)
    const originalSchema = buildASTSchema(parse(fullSchema))
    const prunedSchema = pruneSchema(enabledServices, originalSchema)
    fs.writeFileSync(cachedFullSchema, printSchema(originalSchema))
    fs.writeFileSync(cachedFile, prunedSchema)
    schema = prunedSchema
  }

  const data = {
    gitHubEnabled: false,
    schema: schema || '',
    fullSchema: fullSchema || '',
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
  }
})
