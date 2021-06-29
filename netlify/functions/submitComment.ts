/** Netlify serverless function:
Save this snippet in `netlify/functions/submitComment.js`
*/
import { Netligraph } from './netligraph'
import { withGraph } from './NetligraphHandler'

function executeSubmitComment(
  netligraph: Netligraph,
  { body }: { body: string }
) {
  return netligraph.graph.send({
    query: `
      mutation submitComment($body: String!) {
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
    operationName: 'submitComment',
    variables: { body: body },
    accessToken: netligraph.accessToken,
  })
}

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph) {
    return {
      statusCode: 400,
      body: 'Please enable your netligraph integration',
    }
  }

  const eventBodyJson = JSON.parse(event.body || '{}')

  const body = eventBodyJson?.body

  if (!body) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'You must supply parameters for: `body`' }),
    }
  }

  const { errors: submitCommentErrors, data: submitCommentData } =
    await executeSubmitComment(netligraph, { body })

  if (submitCommentErrors) {
    console.error(submitCommentErrors)
  }

  console.log(submitCommentData)

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      submitCommentErrors: submitCommentErrors,
      submitCommentData: submitCommentData,
    }),
    headers: {
      'content-type': 'application/json',
    },
  }
})

/**
 * Client-side invocations:
 * Call your Netlify function from the browser (after saving
 * the code to `submitComment.js`) with these helpers:
 */

/**
async function executeSubmitComment(params) {
  const {body} = params || {};
  const resp = await fetch("/.netlify/functions/submitComment",
    {
      method: "POST",
      body: JSON.stringify({"body": body})
    });

    const text = await resp.text();

    return JSON.parse(text);
}
*/
