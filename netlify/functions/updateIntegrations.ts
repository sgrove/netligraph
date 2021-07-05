import { withGraph } from './NetligraphHandler'
import { checkServices } from './netligraph'
import {
  generateTypeScriptClient,
  writeTypeScriptClient,
} from './typeScriptClientHelper'
import {
  Database,
  readCommunityFunctionsDatabase,
  writeDatabase,
} from '../../lib/netlifyCliDevDatabases'

export const handler = withGraph(async (event) => {
  const body = JSON.parse(event.body || '{}')

  const accessToken = body.accessToken

  const result = await checkServices({ accessToken: accessToken })

  const loggedInServices: Array<string> =
    result?.data?.me?.serviceMetadata?.loggedInServices?.map(
      (active: any) => active.service
    )

  const serviceBearerTokens: Record<string, string | null> = Object.fromEntries(
    result?.data?.me?.serviceMetadata?.loggedInServices?.map((active: any) => [
      active.service,
      active.bearerToken,
    ])
  )

  if ((result?.errors || []).length > 0) {
    return {
      statusCode: 500,
      body: JSON.stringify(result?.errors),
      headers: {
        'content-type': 'application/json',
      },
    }
  }

  const database: Database = {
    accessToken: accessToken,
    loggedInServices: loggedInServices,
    manuallyEnabledServices: body.manuallyEnabledServices || [],
    serviceBearerTokens: serviceBearerTokens,
    installedFunctionIds: body.installedFunctionIds,
  }

  writeDatabase(database)

  /* Generate the TypeScript file with the enabled functions */
  const communityFunctions = readCommunityFunctionsDatabase()

  /**
   * Regenerate the local `netligraph.functions` library (with
   * types and docstrings)
   */
  const typeScriptClientSource = await generateTypeScriptClient(
    body.installedFunctionIds
  )

  writeTypeScriptClient(typeScriptClientSource)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...database,
      /* Remove `serviceBearerTokens` from the response, we never
      need to expose them to the client */
      serviceBearerTokens: undefined,
    }),
    headers: {
      'content-type': 'application/json',
    },
  }
})
