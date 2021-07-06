/**
 * Shows how to send arbitrary GraphQL queries for those
 * who are comfortable with this level of power.*/
import { NetligraphLibrary } from '../../lib/netligraph'
import { withGraph } from './NetligraphHandler'

export function executeSubmitGitHubComment(
  netligraph: NetligraphLibrary,
  { body }: { body: string }
) {
  return netligraph.graph.send({
    query: `
      mutation submitGitHubComment($body: String!) {
        gitHub {
          addComment(input: {subjectId: "MDU6SXNzdWU4NDk1Mjc0NDg=", body: $body}) {
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
    operationName: 'submitGitHubComment',
    variables: { body: body },
    accessToken: netligraph.accessToken,
  })
}

export const handler = withGraph(async (event, { netligraph }) => {
  const eventBodyJson = JSON.parse(event.body || '{}')

  const body = eventBodyJson?.body

  if (body === undefined || body === null) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'You must supply parameters for: `body`' }),
    }
  }

  const { errors: submitGitHubCommentErrors, data: submitGitHubCommentData } =
    await executeSubmitGitHubComment(netligraph, { body })

  if (submitGitHubCommentErrors) {
    console.error(JSON.stringify(submitGitHubCommentErrors, null, 2))
  }

  console.log(JSON.stringify(submitGitHubCommentData, null, 2))

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      submitGitHubCommentErrors: submitGitHubCommentErrors,
      submitGitHubCommentData: submitGitHubCommentData,
    }),
    headers: {
      'content-type': 'application/json',
    },
  }
})

/**
 * Client-side invocations:
 * Call your Netlify function from the browser (after saving
 * the code to `submitGitHubComment.js`) with these helpers:
 */

/**
async function executeSubmitGitHubComment(params) {
  const {body} = params || {};
  const resp = await fetch("/.netlify/functions/submitGitHubComment",
    {
      method: "POST",
      body: JSON.stringify({"body": body})
    });

    const text = await resp.text();

    return JSON.parse(text);
}
*/
