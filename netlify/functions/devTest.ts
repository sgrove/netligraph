import { withGraph } from './NetligraphHandler'
const path = require('path')

export const handler = withGraph(async () => {
  const data = {
    cwd: process.cwd(),
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
  }
})
