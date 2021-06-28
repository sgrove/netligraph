import fetch from 'isomorphic-unfetch'
import * as fs from 'fs'

/**
 * Simulate the values that Netlify would store in a full integration:
 * 1. List of enabled services
 * 2. OneGraph access token
 */

export type Database = {
  accessToken: string | null
  manuallyEnabledServices: Array<string>
  loggedInServices: Array<string>
}

export const writeDatabase = (fullDatabase: Database) => {
  fs.writeFileSync('tempDatabase.json', JSON.stringify(fullDatabase, null, 2))
}

export const readDatabase = (): Database => {
  try {
    const database = fs.readFileSync('tempDatabase.json').toString()
    return JSON.parse(database)
  } catch {
    return {
      accessToken: null,
      manuallyEnabledServices: [],
      loggedInServices: [],
    }
  }
}

/**
 * Netligraph plumbing
 */
type fetchGitHubIssuesProps = {
  owner: string
  name: string
  first?: number | undefined
  after?: string | undefined
}

const fetchGitHubIssues = (
  netligraph: Netligraph,
  variables: fetchGitHubIssuesProps
) => {
  return netligraph.graph.send({
    query: `query GitHubIssues(  
  $owner: String!
  $name: String!
  $first: Int = 10
  $after: String
) {
  gitHub {
    repository(name: $name, owner: $owner) {
      issues(
        first: $first
        orderBy: { field: CREATED_AT, direction: DESC }
        after: $after
      ) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
        edges {
          node {
            title
            body
            state
            url
          }
        }
      }
    }
  }
}`,
    variables,
    operationName: 'GitHubIssues',
  })
}

interface GitHubEnabledClient {
  enabled: true
  fetchRepositoryIssues: (
    netligraph: Netligraph,
    variables: fetchGitHubIssuesProps
  ) => Promise<GraphQLResponse>
}

interface GitHubDisabledClient {
  enabled: false
}

type GitHubClient = GitHubEnabledClient | GitHubDisabledClient

export type GraphQLResponse = {
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

export type Netligraph = {
  appId: string
  gitHub: GitHubClient
  npm: NpmClient
  graph: {
    send: (params: FetchOneGraphProps) => Promise<GraphQLResponse>
  }
  accessToken: string | null
}

export type MakeClientProps = {
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

  console.log('\tUsing accessToken', accessToken)

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

const serviceEnabled = (database: Database, service: string) => {
  const safeService = service.toLocaleUpperCase()
  return (
    database.loggedInServices.includes(safeService) ||
    database.manuallyEnabledServices.includes(safeService)
  )
}

export function makeClient(props: MakeClientProps): Netligraph {
  const database = readDatabase()

  const fetcher = (params: FetchOneGraphProps) =>
    fetchOneGraph({
      accessToken: params.accessToken,
      query: params.query,
      operationName: params.operationName,
      variables: params.variables,
    })

  return {
    appId: props.appId,
    graph: {
      send: fetcher,
    },
    npm: {
      enabled: serviceEnabled(database, 'npm'),
    },
    gitHub: {
      enabled: serviceEnabled(database, 'gitHub'),
      fetchRepositoryIssues: fetchGitHubIssues,
    },
    accessToken: props.accessToken,
  }
}
