import {
  Handler as NetlifyHandler,
  HandlerContext,
  HandlerCallback,
  HandlerResponse,
  HandlerEvent,
} from '@netlify/functions'
import { Database, makeClient, Netligraph, readDatabase } from './netligraph'

interface Context extends HandlerContext {
  netligraph?: Netligraph
}

interface Handler {
  (event: HandlerEvent, context: Context, callback: HandlerCallback):
    | void
    | HandlerResponse
    | Promise<HandlerResponse>
}

export function withGraph(handler: Handler): NetlifyHandler {
  if (!process.env.ONEGRAPH_APP_ID) {
    return handler
  }

  const database: Database = readDatabase()

  const netligraph = makeClient({
    appId: process.env.ONEGRAPH_APP_ID,
    accessToken: database.accessToken || null,
  })

  return (event, context, callback) =>
    handler(event, { ...context, netligraph }, callback)
}
