import fetch from 'isomorphic-unfetch'
import crypto from 'crypto'
import {
  Database,
  readCommunityFunctionsDatabase,
  readDatabase,
  SerializedCommunityFunction,
  serviceEnabled,
  writeCommunityFunctionsDatabase,
  writeDatabase,
} from './netlifyCliDevDatabases'
import CommunityFunctions from './netligraphCommunityFunctions'
import {
  generateTypeScriptClient,
  writeTypeScriptClient,
} from './typeScriptClientHelper'
import { distinct } from './utils'
import * as fs from 'fs'
import * as Prettier from 'prettier'

/**
 * Netligraph plumbing
 */
interface GitHubEnabledClient {
  enabled: true
  authToken: string | null
}

interface GitHubDisabledClient {
  enabled: false
}

type GitHubClient = GitHubEnabledClient | GitHubDisabledClient

type GraphQLResponse = {
  data: any
  errors: Array<any>
}

interface NpmClient {
  enabled: boolean
}

type FetchOneGraphProps = {
  query: string
  operationName?: string | undefined
  variables?: any
  accessToken?: string | undefined | null
}

export type NetligraphLibrary = {
  enabled: boolean
  appId: string
  gitHub: GitHubClient
  npm: NpmClient
  graph: {
    send: (params: FetchOneGraphProps) => Promise<GraphQLResponse>
  }
  accessToken: string | null
  functions: typeof CommunityFunctions
}

type MakeClientProps = {
  appId: string
  accessToken: string | null
}

export async function fetchOneGraph({
  accessToken,
  query: operationsDoc,
  operationName,
  variables,
}: FetchOneGraphProps): Promise<GraphQLResponse> {
  const payload = {
    query: operationsDoc,
    variables: variables,
    operationName: operationName,
  }

  const result = await fetch(
    `https://serve.onegraph.com/graphql?app_id=${process.env.ONEGRAPH_APP_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: !!accessToken ? `Bearer ${accessToken}` : '',
      },
      body: JSON.stringify(payload),
    }
  )
  return result.json()
}

export function makeClient(props: MakeClientProps): NetligraphLibrary {
  const database = readDatabase()

  const fetcher = (params: FetchOneGraphProps) =>
    fetchOneGraph({
      accessToken: params.accessToken,
      query: params.query,
      operationName: params.operationName,
      variables: params.variables,
    })

  return {
    enabled: true,
    appId: props.appId,
    graph: {
      send: fetcher,
    },
    npm: {
      enabled: serviceEnabled(database, 'npm'),
    },
    gitHub: {
      authToken: database.serviceBearerTokens.GITHUB,
      enabled: serviceEnabled(database, 'gitHub'),
    },
    functions: CommunityFunctions,
    accessToken: props.accessToken,
  }
}

/**
 * Provide a dummy netligraph client that logs out warnings when it's used.
 * This way a user doesn't have to check if it's enabled in their handlers.
 */
export function makeDummyClient(): NetligraphLibrary {
  return {
    enabled: false,
    appId: 'DUMMY_VALUE',
    graph: {
      send: async (unused) => {
        console.warn(
          'Skipping integration call because Netligraph is not enabled, please visit the Netlify dashboard for this app'
        )

        const response: GraphQLResponse = {
          data: null,
          errors: [],
        }

        return response
      },
    },
    npm: {
      enabled: false,
    },
    gitHub: {
      enabled: false,
    },
    // @ts-ignore: This is fine for the PoC, but the types would need to be improved for the production release
    functions: {},
    accessToken: null,
  }
}

export const editFunctionLibrary = async (
  userFn: SerializedCommunityFunction
) => {
  const database = readDatabase()
  const communityFunctions = readCommunityFunctionsDatabase()

  let replacedFunction = false

  let newCommunityFunctions = communityFunctions.map((fn) => {
    if (fn.id === userFn.id) {
      replacedFunction = true
      return userFn
    }

    return fn
  })

  if (!replacedFunction) {
    newCommunityFunctions = [...newCommunityFunctions, userFn]
  }

  writeCommunityFunctionsDatabase(newCommunityFunctions)

  const newDatabase: Database = {
    ...database,
    installedFunctionIds: distinct([
      ...database.installedFunctionIds,
      userFn.id,
    ]),
  }

  writeDatabase(newDatabase)

  const typeScriptClientSource = await generateTypeScriptClient(
    newDatabase.installedFunctionIds
  )

  writeTypeScriptClient(typeScriptClientSource)

  const result = {
    communityFunctions: newCommunityFunctions,
    database: newDatabase,
  }

  return result
}

export const FindLoggedInServicesQuery = `query FindLoggedInServicesQuery {
  me {
    serviceMetadata {
      loggedInServices {
        friendlyServiceName
        service
        isLoggedIn
        bearerToken
      }
    }
  }
}`

export const checkServices = ({
  accessToken,
}: {
  accessToken: string | null
}) => {
  return fetchOneGraph({
    accessToken: accessToken,
    query: FindLoggedInServicesQuery,
    operationName: 'FindLoggedInServicesQuery',
    variables: {},
  })
}

export type NewNetlifyFunction = {
  functionName: string
  source: string
}

export const writeNetlifyFunction = (newFunction: NewNetlifyFunction) => {
  const filename = `netlify/functions/${newFunction.functionName}.ts`
  const source = newFunction.source.replaceAll('\u200b', '')
  const formatted = Prettier.format(source, {
    tabWidth: 2,
    semi: false,
    singleQuote: true,
    parser: 'babel-ts',
  })

  fs.writeFileSync(filename, formatted)
}

/**
 * Subscription helpers
 */
export const verifySignature = ({
  secret,
  body,
  signature,
}: {
  secret: string
  body: string
  signature: string | undefined
}) => {
  if (!signature) {
    console.error('Missing signature')
    return false
  }

  const sig: any = {}
  for (const pair of signature.split(',')) {
    const [k, v] = pair.split('=')
    sig[k] = v
  }

  if (!sig.t || !sig.hmac_sha256) {
    console.error('Invalid signature header')
    return false
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(sig.t)
    .update('.')
    .update(body)
    .digest('hex')

  if (
    !crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(sig.hmac_sha256, 'hex')
    )
  ) {
    console.error('Invalid signature')
    return false
  }

  if (parseInt(sig.t, 10) < Date.now() / 1000 - 300 /* 5 minutes */) {
    console.error('Request is too old')
    return false
  }

  return true
}
