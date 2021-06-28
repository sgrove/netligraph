/**
Save this snippet in `netlify/functions/npmPackage.js`
*/
import { withGraph } from './NetligraphHandler'

function fetchNpmPackage(netligraph, { name, amount, precision, checkValid }) {
  return netligraph.graph.send({
    query: `
      query npmPackage($name: String = "onegraph-apollo-client", $amount: Int!, $precision: Float!, $checkValid: Boolean) {
        npm {
          package(name: $name) {
            name
            homepage
            downloads {
              lastMonth {
                count
              }
            }
            repository {
              sourceRepository {
                ... on GitHubRepository {
                  id
                  name
                  description
                }
              }
            }
          }
        }
      }`,
    operationName: 'npmPackage',
    variables: {
      name: name,
      amount: amount,
      precision: precision,
      checkValid: checkValid,
    },
    accessToken: netligraph.accessToken,
  })
}

function fetchGraphQLPackage(netligraph, {}) {
  return netligraph.graph.send({
    query: `
      query graphQLPackage {
        npm {
          package(name: "graphql") {
            name
            homepage
            downloads {
              lastMonth {
                count
              }
            }
            repository {
              sourceRepository {
                ... on GitHubRepository {
                  id
                  name
                  description
                }
              }
            }
          }
        }
      }`,
    operationName: 'graphQLPackage',
    variables: {},
    accessToken: netligraph.accessToken,
  })
}

export const handler = withGraph(
  async (event, { netligraph: netligraphClient }) => {
    if (!netligraphClient) {
      return {
        statusCode: 400,
        body: 'Please enable your netligraph integration',
      }
    }

    if (!netligraphClient.gitHub.enabled) {
      return {
        statusCode: 400,
        body: 'Please enable your GitHub integration',
      }
    }

    netligraphClient.gitHub.fetchRepositoryIssues(netligraphClient, {
      name: 'blog',
      owner: 'sgrove',
      first: 100,
    })

    // Use the incoming authorization header when making API calls on the user's behalf
    const accessToken = event.headers['authorization']?.split(' ')[1]
    const netligraph = { ...netligraphClient, accessToken: accessToken }

    const eventBodyJson = JSON.parse(event.body || '{}')

    const name = eventBodyJson?.name
    const amount = eventBodyJson?.amount
    const precision = eventBodyJson?.precision
    const checkValid = eventBodyJson?.checkValid

    if (!name || !amount || !precision || !checkValid) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error:
            'You must supply parameters for: `name`, `amount`, `precision`, `checkValid`',
        }),
      }
    }

    const { errors: npmPackageErrors, data: npmPackageData } =
      await fetchNpmPackage(netligraph, { name, amount, precision, checkValid })

    if (npmPackageErrors) {
      console.error(npmPackageErrors)
    }

    console.log(npmPackageData)

    const { errors: graphQLPackageErrors, data: graphQLPackageData } =
      await fetchGraphQLPackage(netligraph, {})

    if (graphQLPackageErrors) {
      console.error(graphQLPackageErrors)
    }

    console.log(graphQLPackageData)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        npmPackageErrors: npmPackageErrors,
        npmPackageData: npmPackageData,
        graphQLPackageErrors: graphQLPackageErrors,
        graphQLPackageData: graphQLPackageData,
      }),
      headers: {
        'content-type': 'application/json',
      },
    }
  }
)
