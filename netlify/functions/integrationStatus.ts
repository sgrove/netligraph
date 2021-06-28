import { Database, readDatabase, writeDatabase } from './netligraph'
import { withGraph } from './NetligraphHandler'
import { Netligraph } from './netligraph'

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
  const database: Database = readDatabase()

  if (!netligraph) {
    return {
      statusCode: 400,
      body: 'Please enable the your integrations',
    }
  }

  const client: Netligraph = {
    ...netligraph,
    accessToken: database.accessToken,
  }

  const result = await findEnabledServicesQuery(client)

  const loggedInServices: Array<string> =
    result?.data?.me?.serviceMetadata?.loggedInServices?.map(
      (active: any) => active.service
    )

  const newDatabase: Database = {
    ...database,
    loggedInServices: loggedInServices,
  }

  writeDatabase(newDatabase)

  return {
    statusCode: 200,
    body: JSON.stringify(newDatabase),
    headers: {
      'content-type': 'application/json',
    },
  }
})
