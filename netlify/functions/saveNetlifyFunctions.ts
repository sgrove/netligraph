import { NewNetlifyFunction, writeNetlifyFunction } from './netligraph'
import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async (event) => {
  const body = JSON.parse(event.body || '{}')

  const functions = body.functions || []

  functions.forEach((newFunction: NewNetlifyFunction) => {
    writeNetlifyFunction(newFunction)
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ functionCount: functions.length }),
    headers: {
      'content-type': 'application/json',
    },
  }
})
