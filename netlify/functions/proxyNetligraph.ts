import { withGraph } from './NetligraphHandler'
const fetch = require('node-fetch')
const path = require('path')

export const handler = withGraph(async (event) => {
  const payload = JSON.parse(
    JSON.stringify({
      method: event.httpMethod,
      // @ts-ignore: I think this works?
      headers: event.headers || {},
      body: event.body,
    })
  )
  delete payload.headers['host']

  const res = await fetch(
    `https://serve.onegraph.com/graphql?app_id=${process.env.ONEGRAPH_APP_ID}`,
    payload
  )

  const body = await res.text()

  const headers = JSON.parse(JSON.stringify(res.headers))

  return {
    statusCode: res.status,
    body: body,
    headers: headers,
  }
})
