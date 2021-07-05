import {
  Database,
  readDatabase,
  writeDatabase,
} from '../../lib/netlifyCliDevDatabases'
import { checkServices } from '../../lib/netligraph'
import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async (event, { netligraph }) => {
  const database: Database = readDatabase()

  const servicesResult = await checkServices({
    accessToken: database.accessToken,
  })

  /**
   * Find all of the services we have an active, working auth based
   * on the current accessToken in the database.
   */
  const loggedInServices: Array<string> =
    servicesResult?.data?.me?.serviceMetadata?.loggedInServices?.map(
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
