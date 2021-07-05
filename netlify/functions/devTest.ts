import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async (event, { netligraph }) => {
  const data = {
    success: true,
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
  }
})
