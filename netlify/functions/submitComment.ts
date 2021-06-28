import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph?.gitHub.enabled) {
    return {
      statusCode: 400,
      body: 'Please enable the GitHub netligraph',
    }
  }

  const comment = event.queryStringParameters?.comment

  if (!comment) {
    return {
      statusCode: 422,
      body: 'You must supply a `comment` parameter',
    }
  }

  const issueId = 'MDU6SXNzdWU4NDk1Mjc0NDg='

  const result = await netligraph.graph.send({
    query: `mutation AddComment($subjectId: String!, $body: String!) {
    gitHub {
      addComment(
        input: {
          subjectId: $subjectId
          body: $body
        }
      ) {
        clientMutationId
        commentEdge {
          node {
            id
            url
            body
          }
        }
      }
    }
  }`,
    operationName: 'AddComment',
    variables: { body: comment, subjectId: issueId },
  })

  return {
    statusCode: 200,
    body: JSON.stringify(result),
    headers: {
      'content-type': 'application/json',
    },
  }
})
