import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph?.gitHub.enabled) {
    return {
      statusCode: 400,
      body: 'Please enable the GitHub netligraph',
    }
  }

  const owner = event.queryStringParameters?.owner
  const name = event.queryStringParameters?.name
  const count = event.queryStringParameters?.count
  const cursor = event.queryStringParameters?.cursor

  if (!owner || !name) {
    return {
      statusCode: 422,
      body: 'You must supply a `owner` and `name` parameter',
    }
  }

  const { data } = await netligraph.gitHub.fetchRepositoryIssues(netligraph, {
    owner,
    name,
    first: !!count ? parseInt(count) : undefined,
    after: cursor,
  })

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
  }
})
