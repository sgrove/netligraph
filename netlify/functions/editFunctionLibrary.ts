import { editFunctionLibrary as upsertFunctionIntoLibrary } from '../../lib/netligraph'
import { withGraph } from './NetligraphHandler'

export const handler = withGraph(async (event) => {
  const body = JSON.parse(event.body || '{}')

  const result = upsertFunctionIntoLibrary(
    body.function,
    body.installedFunctionIds
  )

  return {
    statusCode: 200,
    body: JSON.stringify(result),
    headers: {
      'content-type': 'application/json',
    },
  }
})
