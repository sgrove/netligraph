import { withGraph } from './NetligraphHandler'
import { Octokit } from '@octokit/rest'

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph?.gitHub.enabled) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Please enable the GitHub netligraph integration',
      }),
    }
  }

  // We're using the raw GitHub API client, so we need an auth token already present
  if (!netligraph?.gitHub.authToken) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error:
          'Please install an auth token for your GitHub netligraph integration',
      }),
    }
  }

  const ocktokit = new Octokit({ auth: netligraph.gitHub.authToken })

  const eventBodyJson = JSON.parse(event.body || '{}')

  const owner = eventBodyJson?.owner
  const name = eventBodyJson?.name
  const count = eventBodyJson?.first
  const cursor = eventBodyJson?.cursor

  if (!owner || !name) {
    return {
      statusCode: 422,
      body: JSON.stringify({
        error: 'You must supply a `owner` and `name` parameter',
      }),
    }
  }

  const { data } = await ocktokit.rest.issues.list({
    owner,
    name,
    first: !!count ? parseInt(count) : undefined,
    after: cursor,
  })

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      'github-client': 'ocktokit',
      'content-type': 'application/json',
    },
  }
})
