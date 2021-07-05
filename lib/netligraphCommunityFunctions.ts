// GENERATED VIA `netlify-cli dev`, EDIT WITH CAUTION!
import { HandlerEvent } from '@netlify/functions'
import { fetchOneGraph, verifySignature } from './netligraph'

export const verifyRequestSignature = ({ event }: { event: HandlerEvent }) => {
  const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET
  const signature = event.headers['x-onegraph-signature']
  const body = event.body

  if (!secret) {
    console.error(
      'NETLIGRAPH_WEBHOOK_SECRET is not set, cannot verify incoming webhook request'
    )
    return false
  }

  return verifySignature({ secret, signature, body: body || '' })
}

const UpdateFileMutation = (
  variables: {
    repoOwner: string
    repoName: string
    branchName: string
    path: string
    message: string
    content: string
    sha: string
  },
  accessToken?: string | null
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    gitHub: {
      /**
       * Create a commit updating a single file
       */
      createOrUpdateFileContent_oneGraph: {
        commit: {
          /**
           * The Git commit message
           */
          message: string
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}> => {
  return fetchOneGraph({
    query: `mutation UpdateFileMutation(
    $repoOwner: String!
    $repoName: String!
    $branchName: String!
    $path: String!
    $message: String!
    $content: String!
    $sha: String!
  ) {
    gitHub {
      createOrUpdateFileContent_oneGraph(
        input: {
          message: $message
          path: $path
          repoName: $repoName
          repoOwner: $repoOwner
          branchName: $branchName
          plainContent: $content
          existingFileSha: $sha
        }
      ) {
        commit {
          message
        }
      }
    }
  }`,
    variables: variables,
    accessToken: accessToken,
  })
}

const ListFilesOnDefaultBranch = (
  variables: { owner: string; name: string },
  accessToken?: string | null
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    gitHub: {
      /**
       * Lookup a given repository by the owner and repository name.
       */
      repository: {
        id: string
        /**
         * The Ref associated with the repository's default branch.
         */
        defaultBranchRef: {
          id: string
          /**
           * The ref name.
           */
          name: string
          /**
           * The object the ref points to. Returns null when object does not exist.
           */
          target: {
            id: string
            /**
             * The Git object ID
             */
            oid: string
            /**
             * The linear commit history starting from (and including) this commit, in the same order as `git log`.
             */
            history: {
              /**
               * A list of edges.
               */
              edges: Array<{
                /**
                 * The item at the end of the edge.
                 */
                node: {
                  /**
                   * Commit's root Tree
                   */
                  tree: {
                    /**
                     * A list of tree entries.
                     */
                    entries: Array<{
                      /**
                       * Entry file name.
                       */
                      name: string
                      /**
                       * The full path of the file.
                       */
                      path: string
                      /**
                       * Entry file Git object ID.
                       */
                      oid: string
                      /**
                       * Entry file object.
                       */
                      object: {
                        id: string
                        /**
                         * A list of tree entries.
                         */
                        entries: Array<{
                          /**
                           * Entry file name.
                           */
                          name: string
                          /**
                           * The full path of the file.
                           */
                          path: string
                          /**
                           * Entry file Git object ID.
                           */
                          oid: string
                        }>
                      }
                    }>
                  }
                }
              }>
            }
            /**
             * Commit's root Tree
             */
            tree: {
              id: string
              /**
               * The Git object ID
               */
              oid: string
            }
          }
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}> => {
  return fetchOneGraph({
    query: `query ListFilesOnDefaultBranch($owner: String!, $name: String!) {
    gitHub {
      repository(name: $name, owner: $owner) {
        id
        defaultBranchRef {
          ... on GitHubRef {
            id
            name
            target {
              id
              oid
              ... on GitHubCommit {
                history(first: 1) {
                  edges {
                    node {
                      tree {
                        entries {
                          name
                          path
                          oid
                          object {
                            ... on GitHubTree {
                              id
                              entries {
                                name
                                path
                                oid
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                tree {
                  id
                  oid
                }
              }
            }
          }
        }
      }
    }
  }`,
    variables: variables,
    accessToken: accessToken,
  })
}

const SetStatus = (
  variables: { message: string; limitedAvailability: boolean },
  accessToken?: string | null
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    gitHub: {
      /**
       * Update your status on GitHub.
       */
      changeUserStatus: {
        /**
         * Your updated status.
         */
        status: {
          /**
           * ID of the object.
           */
          id: string
          /**
           * A brief message describing what the user is doing.
           */
          message: string
          /**
           * Whether this status indicates the user is not fully available on GitHub.
           */
          indicatesLimitedAvailability: boolean
          /**
           * Identifies the date and time when the object was last updated.
           */
          updatedAt: any
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}> => {
  return fetchOneGraph({
    query: `mutation SetStatus(
    $message: String!
    $limitedAvailability: Boolean = false
  ) {
    gitHub {
      changeUserStatus(
        input: {
          message: $message
          limitedAvailability: $limitedAvailability
        }
      ) {
        status {
          id
          message
          indicatesLimitedAvailability
          updatedAt
        }
      }
    }
  }`,
    variables: variables,
    accessToken: accessToken,
  })
}

const AsanaProjectMembers = (
  variables: { name: string; projectId: string },
  accessToken?: string | null
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    /**
     * The root for Asana queries
     */
    asana: {
      /**
       * Get a single project.
       */
      project: {
        /**
         * Users who are members of this project.
         */
        members: Array<{
          /**
           * Name of the user.
           */
          name: string
          /**
           * The user's email address.
           */
          email: string
          /**
           * Globally unique identifier of the resource, as a string.
           */
          gid: string
        }>
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}> => {
  return fetchOneGraph({
    query: `query AsanaProjectMembers($name: String!, $projectId: String!) {
  asana {
    project(gid: $projectId) {
      members {
        name
        email
        gid
      }
    }
  }
}
`,
    variables: variables,
    accessToken: accessToken,
  })
}

const ViewerInfo = (
  variables: {},
  accessToken?: string | null
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    gitHub: {
      /**
       * The currently authenticated user.
       */
      viewer: {
        /**
         * Whether or not this user is a GitHub employee.
         */
        isEmployee: boolean
        /**
         * Whether or not this user is a member of the GitHub Stars Program.
         */
        isGitHubStar: boolean
        /**
         * The user's publicly visible profile email.
         */
        email: string
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}> => {
  return fetchOneGraph({
    query: `query ViewerInfo {
  gitHub {
    viewer {
      isEmployee
      isGitHubStar
      email
    }
  }
}
`,
    variables: variables,
    accessToken: accessToken,
  })
}

const ListIssues = (
  variables: { owner: string; name: string; first: number; after: string },
  accessToken?: string | null
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    gitHub: {
      /**
       * Lookup a given repository by the owner and repository name.
       */
      repository: {
        /**
         * A list of issues that have been opened in the repository.
         */
        issues: {
          /**
           * Information to aid in pagination.
           */
          pageInfo: {
            /**
             * When paginating forwards, the cursor to continue.
             */
            endCursor: string
            /**
             * When paginating forwards, are there more items?
             */
            hasNextPage: boolean
            /**
             * When paginating backwards, are there more items?
             */
            hasPreviousPage: boolean
            /**
             * When paginating backwards, the cursor to continue.
             */
            startCursor: string
          }
          /**
           * Identifies the total count of items in the connection.
           */
          totalCount: number
          /**
           * A list of edges.
           */
          edges: Array<{
            /**
             * The item at the end of the edge.
             */
            node: {
              /**
               * Identifies the issue title.
               */
              title: string
              /**
               * Identifies the body of the issue.
               */
              body: string
              /**
               * Identifies the state of the issue.
               */
              state: 'OPEN' | 'CLOSED'
              /**
               * The HTTP URL for this issue
               */
              url: any
            }
          }>
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}> => {
  return fetchOneGraph({
    query: `query ListIssues(  
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
    variables: variables,
    accessToken: accessToken,
  })
}

const subscribeToIncomingGitHubComment = (
  /**
   * This will be available in your webhook handler as a query parameter.
   * Use this to keep track of which subscription you're receiving
   * events for.
   */
  netligraphWebhookId: string,
  variables: { repoOwner: string; repoName: string },
  accessToken?: string | null
): void => {
  const netligraphWebhookUrl = `${process.env.DEPLOY_URL}/.netlify/functions/IncomingGitHubComment?netligraphWebhookId=${netligraphWebhookId}`
  const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET

  fetchOneGraph({
    query: `subscription IncomingGitHubComment($repoOwner: String!, $repoName: String!, $netligraphWebhookUrl: String!, $netligraphWebhookSecret: OneGraphSubscriptionSecretInput!) {
  github(webhookUrl: $netligraphWebhookUrl, secret: $netligraphWebhookSecret) {
    issueCommentEvent(input: {repoOwner: $repoOwner, repoName: $repoName}) {
      action
      comment {
        id
        body
        bodyHTML
        url
      }
    }
  }
}`,
    variables: {
      ...variables,
      netligraphWebhookUrl: netligraphWebhookUrl,
      netligraphWebhookSecret: { hmacSha256Key: secret },
    },
    accessToken: accessToken,
  })
}

const parseAndVerifyIncomingGitHubComment = (
  event: HandlerEvent
): null | {
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    github: {
      /**
       * Subscribe to issue comments on a repository.
       */
      issueCommentEvent: {
        /**
         * The action that was performed.
         */
        action: 'CREATED' | 'EDITED' | 'DELETED'
        /**
         * The comment itself.
         */
        comment: {
          id: string
          /**
           * The body as Markdown.
           */
          body: string
          /**
           * The body rendered to HTML.
           */
          bodyHTML: any
          /**
           * The HTTP URL for this issue comment
           */
          url: any
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
} => {
  if (!verifyRequestSignature({ event: event })) {
    console.warn('Unable to verify signature for IncomingGitHubComment')
    return null
  }

  return JSON.parse(event.body || '{}')
}

const functions = {
  /**
   * Create a single commit on the GitHub project `${repoOwner}/${repoName}` that `upserts` (creates a new file if it doesn't exist, or updates it if it does).
   *
   *   For example, to add a new file `/examples/MyExample.md` to the [OneGraph GraphQL Docs Repository](https://github.com/OneGraph/graphql-docs/tree/master/src/examples), the following variables would work:
   *   ```
   *   {
   *     `repoName`: `graphql-docs`,
   *     `repoOwner`: `OneGraph`,
   *     `branchName`: `master`,
   *     `path`: `src/examples/MyExample.md`,
   *     `message`: `Adding a new example`,
   *     `content`: `Example file content here`,
   *     `sha`: null
   *   }
   * ```
   *   Note that if you're _updating_ a file, you'll need to provide its *current* sha for the mutation to succeed. See the [GitHubGetFileShaAndContent example](GitHubGetFileShaAndContent) for how to find an existing file's sha.
   */
  UpdateFileMutation: UpdateFileMutation,
  /**
   * List the files two levels deep on the default branch of a GitHub repository
   */
  ListFilesOnDefaultBranch: ListFilesOnDefaultBranch,
  /**
   * Set your GitHub status
   */
  SetStatus: SetStatus,
  /**
   * List the members of a given project (by id) on Asana
   */
  AsanaProjectMembers: AsanaProjectMembers,
  /**
   * Get all the info about the logged in user!
   */
  ViewerInfo: ViewerInfo,
  /**
   * List issues (with pagination) on a GitHub repository
   */
  ListIssues: ListIssues,
  /**
   * Do it again!
   */
  subscribeToIncomingGitHubComment: subscribeToIncomingGitHubComment,
  /**
   * Verify the event body is signed securely, and then parse the result.
   */
  parseAndVerifyIncomingGitHubComment: parseAndVerifyIncomingGitHubComment,
}

export default functions
