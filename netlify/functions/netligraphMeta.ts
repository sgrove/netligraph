// To be implemented on Netlify's side so that it's not publicly accessible (if that's desirable)
import { fetchOneGraph, readDatabase } from './netligraph'
import {
  buildClientSchema,
  getIntrospectionQuery,
  getNamedType,
  printSchema,
  GraphQLSchema,
} from 'graphql'
import { withGraph } from './NetligraphHandler'
import { GraphQLFieldConfig } from 'graphql'
import * as fs from 'fs'
import { Database } from '../../public/pages/home'
const { wrapSchema, FilterRootFields } = require('@graphql-tools/wrap')

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

async function fetchFullSchema() {
  const result = await fetchOneGraph({
    query: getIntrospectionQuery(),
  })

  return result
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

function pruneSchema(
  enabledServices: Array<string>,
  originalSchema: GraphQLSchema
) {
  const clientSchema = wrapSchema({
    schema: originalSchema,
    transforms: [
      new FilterRootFields(
        (
          operationName: string,
          fieldName: string,
          fieldConfig: GraphQLFieldConfig<any, any>
        ) => {
          const namedType = getNamedType(fieldConfig.type)
          const include =
            namedType && shouldRetainNamed(enabledServices, namedType)

          return include
        }
      ),
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

  if (fs.existsSync(cachedFile)) {
    schema = fs.readFileSync(cachedFile).toString()
    console.debug('Hit cached path for ', cachedFile)
  } else {
    console.debug('No cache, calculating schema for ', cachedFile)
    const schemaSource = await fetchFullSchema()
    const originalSchema = buildClientSchema(schemaSource.data)
    const prunedSchema = pruneSchema(enabledServices, originalSchema)
    fs.writeFileSync(cachedFile, prunedSchema)
    schema = prunedSchema
  }

  const data = {
    gitHubEnabled: false,
    schema: schema || '',
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
  }
})
