# Netligraph proof of concept

# Setup

```
git clone git@github.com:sgrove/netligraph.git
cd netligraph
npm i
echo "ONEGRAPH_APP_ID=759b23db-c990-4426-b8e1-a4034e72c1ca" > .env
netlify dev
```

# Configuration

The only configuration option in `.env` is `ONEGRAPH_APP_ID`, feel free to use this (already
included in the setup notes above):

```
ONEGRAPH_APP_ID=759b23db-c990-4426-b8e1-a4034e72c1ca
```

# Implementation notes
A few notes on the POC implementation that would be changed for a real deployment

## `tempDatabase.json` needs a persistent file system
Other values that would normally be env variables are backed by `tempDatabase.json`, 
including your auth access token, the enabled API services, and a list of APIs that
we're able to access using the provided access token.

_This means the POC will only work locally with a persistent file system_

There are two Netlify function endpoints that read/write to `tempDatabase.json` so
that the experience in the POC is fast and fluid, but it's just an artifact of
implementation, not a permanent architecture decision.

## Graph pruning
It takes a few seconds to prune the graph in JavaScript (which is then cached to the local filesystem),
but I wanted to keep the POC as self-contained as possible. In a real deployment this
would be done on OneGraph's side.
