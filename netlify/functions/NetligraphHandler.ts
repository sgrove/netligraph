import {
  Handler as NetlifyHandler,
  HandlerContext,
  HandlerCallback,
  HandlerResponse,
  HandlerEvent,
} from '@netlify/functions'
import { makeClient, makeDummyClient } from '../../lib/netligraph'
import * as Netligraph from '../../lib/netligraph'
import { Database, readDatabase } from '../../lib/netlifyCliDevDatabases'

interface Context extends HandlerContext {
  netligraph: Netligraph.NetligraphLibrary
}

interface Handler {
  (event: HandlerEvent, context: Context, callback: HandlerCallback):
    | void
    | HandlerResponse
    | Promise<HandlerResponse>
}

export function withGraph(handler: Handler): NetlifyHandler {
  let netligraph: Netligraph.NetligraphLibrary

  if (!process.env.ONEGRAPH_APP_ID) {
    netligraph = makeDummyClient()
  } else {
    const database: Database = readDatabase()

    netligraph = makeClient({
      appId: process.env.ONEGRAPH_APP_ID,
      accessToken: database.accessToken || null,
    })
  }

  return (event, context, callback) =>
    handler(event, { ...context, netligraph }, callback)
}
