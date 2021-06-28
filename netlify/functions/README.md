The files in this directory are what Netlify should implement on their backend and store:

1. Enabled APIs
2. OneGraph auth token for server-side usage (or we can implement a collection of OAuth tokens if we want to stick with e.g. Netlify Identity flows)
3. The GraphQL schema as it was pruned - the file can be made relatively small and cached


ENV vars:
1. ONEGRAPH_APP_ID
2. ONEGRAPH_AUTH_TOKEN