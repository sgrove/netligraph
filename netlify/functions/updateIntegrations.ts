import { withGraph } from './NetligraphHandler'
import { Database, Netligraph, readDatabase, writeDatabase } from './netligraph'

const FindEnabledServicesQuery = `query FindEnabledServicesQuery {
  me {
    serviceMetadata {
      loggedInServices {
        friendlyServiceName
        service
        isLoggedIn
      }
    }
  }
}`

const findEnabledServicesQuery = (client: Netligraph) => {
  return client?.graph?.send({
    query: FindEnabledServicesQuery,
    operationName: 'FindEnabledServicesQuery',
    accessToken: client.accessToken,
  })
}

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph) {
    return {
      statusCode: 400,
      body: 'Please enable the your integrations',
    }
  }
  const body = JSON.parse(event.body || '{}')

  const accessToken = body.accessToken

  const client: Netligraph = { ...netligraph, accessToken: accessToken }

  const result = await findEnabledServicesQuery(client)

  const loggedInServices: Array<string> =
    result?.data?.me?.serviceMetadata?.loggedInServices?.map(
      (active: any) => active.service
    )

  if ((result?.errors?.length || 0) > 0) {
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
  }

  writeDatabase(database)

  return {
    statusCode: 200,
    body: JSON.stringify(database),
    headers: {
      'content-type': 'application/json',
    },
  }
})
