import { withGraph } from './NetligraphHandler'
import * as fs from 'fs'

type NewNetlifyFunction = {
  functionName: string
  source: string
}

const writeNetlifyFunction = (newFunction: NewNetlifyFunction) => {
  const filename = `netlify/functions/${newFunction.functionName}.ts`
  fs.writeFileSync(filename, newFunction.source.replaceAll('\u200b', ''))
}

export const handler = withGraph(async (event, { netligraph }) => {
  if (!netligraph) {
    return {
      statusCode: 400,
      body: 'Please enable the your integrations',
    }
  }
  const body = JSON.parse(event.body || '{}')

  const functions: Array<NewNetlifyFunction> = body.functions || []

  functions.forEach((newFunction) => {
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
