import { readCommunityFunctionsDatabase } from '../../lib/netlifyCliDevDatabases'
import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async () => {
  const communityFunctions = readCommunityFunctionsDatabase()

  return {
    statusCode: 200,
    body: JSON.stringify(communityFunctions),
    headers: {
      'content-type': 'application/json',
    },
  }
})
