import { CommunityFunction, Database } from './pages/home'
import {
  getNamedType,
  GraphQLSchema,
  visit,
  visitWithTypeInfo,
  OperationDefinitionNode,
  TypeInfo,
  print,
  parse,
} from 'graphql'
import { VariableDefinitionNode } from 'graphql'
import { DefinitionNode } from 'graphql'
import { SerializedCommunityFunction } from '../lib/netlifyCliDevDatabases'
// @ts-ignore: No typescript defs
import { OneGraphAuth } from 'onegraph-auth'

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

/**
 * Handle netlify dev live urls slightly better and hide more of OneGraph. Still needs
 * a better "permanent" handle so CORS can be both safe and convenient.
 */
export const makeAuth = ({ appId }: { appId: string | undefined }) => {
  return new OneGraphAuth({
    appId: appId,
    graphqlUrl: `${window.location.protocol}//${window.location.host}/graph`,
  })
}

/**
 * This can be pushed into OneGraph so it's dynamic and always
 * up to date.
 */
const ServiceLookup = {
  adroll: ['adroll.com', 'Adroll'],
  asana: ['asana.com', 'Asana'],
  box: ['box.com', 'Box'],
  'dev-to': ['dev.to', 'Dev.to'],
  dribbble: ['dribbble.com', 'Dribbble'],
  dropbox: ['dropbox.com', 'Dropbox'],
  contentful: ['contentful.com', 'Contentful'],
  eggheadio: ['eggheadio.com', 'Egghead.io'],
  eventil: ['eventil.com', 'Eventil'],
  facebook: ['facebook.com', 'Facebook'],
  facebookBusiness: ['facebook.com', 'Facebook'],
  github: ['githubsatellite.com', 'GitHub'],
  gmail: ['gmail.com', 'Gmail'],
  google: ['google.com', 'Google'],
  'google-ads': ['google.com', 'Google Ads'],
  'google-analytics': ['google-analytics.com', 'Google Analytics'],
  'google-calendar': ['google-calendar.com', 'Google Calendar'],
  'google-compute': ['google-compute.com', 'Google Compute'],
  'google-docs': ['google-docs.com', 'Google Docs'],
  'google-search-console': ['google.com', 'Google Search Console'],
  'google-translate': ['google-translate.com', 'Google Translate'],
  hubspot: ['hubspot.com', 'Hubspot'],
  intercom: ['intercom.com', 'Intercom'],
  mailchimp: ['mailchimp.com', 'Mailchimp'],
  meetup: ['meetup.com', 'Meetup'],
  netlify: ['netlify.com', 'Netlify'],
  'product-hunt': ['producthunt.com', 'Product Hunt'],
  quickbooks: ['quickbooks.com', 'QuickBooks'],
  salesforce: ['salesforce.com', 'Salesforce'],
  slack: ['slack.com', 'Slack'],
  spotify: ['spotify.com', 'Spotify'],
  stripe: ['stripe.com', 'Stripe'],
  trello: ['trello.com', 'Trello'],
  twilio: ['twilio.com', 'Twilio'],
  twitter: ['twitter.com', 'Twitter'],
  'twitch-tv': ['twitch-tv.com', 'Twitch'],
  ynab: ['ynab.com', 'You Need a Budget'],
  youtube: ['youtube.com', 'YouTube'],
  zeit: ['vercel.com', 'Vercel'],
  zendesk: ['zendesk.com', 'Zendesk'],
  airtable: ['airtable.com', 'Airtable'],
  apollo: ['apollo.com', 'Apollo'],
  brex: ['brex.com', 'Brex'],
  bundlephobia: ['bundlephobia.com', 'Bundlephobia'],
  clearbit: ['clearbit.com', 'Clearbit'],
  cloudflare: ['cloudflare.com', 'Cloudflare'],
  crunchbase: ['crunchbase.com', 'Crunchbase'],
  fedex: ['fedex.com', 'Fedex'],
  'google-maps': ['google-maps.com', 'Google Maps'],
  graphcms: ['graphcms.com', 'GraphCMS'],
  'immigration-graph': ['immigration-graph.com', 'Immigration Graph'],
  logdna: ['logdna.com', 'LogDNA'],
  mixpanel: ['mixpanel.com', 'Mixpanel'],
  mux: ['mux.com', 'Mux'],
  npm: ['npmjs.com', 'Npm'],
  oneGraph: ['onegraph.com', 'OneGraph'],
  orbit: ['orbit.love', 'Orbit'],
  openCollective: ['opencollective.com', 'OpenCollective'],
  ups: ['ups.com', 'UPS'],
  usps: ['usps.com', 'USPS'],
  wordpress: ['wordpress.com', 'Wordpress'],
  firebase: ['firebase.me', 'Firebase'],
  rss: ['rss.com', 'RSS'],
}
type Keys = keyof typeof ServiceLookup

export const serviceImageUrl = (service: Keys, size = 50) => {
  const lookup = ServiceLookup[service]
  if (!lookup) {
    return '//logo.clearbit.com/netlify'
  }

  return `//logo.clearbit.com/${lookup[0]}?size=${size}`
}

export type GraphQLRequest = {
  query: string
  operationName?: string
  doc_id?: string
  variables?: any
}

export async function graphqlFetcher(auth: any, params: GraphQLRequest) {
  const response = await fetch('/graph', {
    method: 'POST',
    headers: {
      ...auth?.authHeaders(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  const responseBody = await response.text()

  try {
    return JSON.parse(responseBody)
  } catch (e) {
    return responseBody
  }
}

// Uses a persisted query to get a list of all supported services
// (OAuth and non-OAuth alike). Can be removed in the final version
// in favor of something more concrete.
export const fetchAllServices = async () => {
  const resp = await fetch('/graph', {
    method: 'POST',
    body: JSON.stringify({
      doc_id: '1879e711-32b7-4873-9d20-38e13f3dd011',
      operationName: 'ServiceList',
    }),
  })
  const text = await resp.text()
  const json = JSON.parse(text)
  return json.data.query.fields.map((field: any) => field.name)
}

export type OAuthService = {
  serviceEnum: string
  service: string
  friendlyServiceName: string
  supportsOAuth: true
}

export type Service = {
  service: string
  supportsOAuth: false
}

export type APIService = OAuthService | Service

export const combineAllServices = (
  allServiceFields: Array<string>,
  oauthServices: Array<OAuthService>
): Array<APIService> => {
  return allServiceFields.map((serviceName) => {
    const oauthVersion = oauthServices.find(
      (service) =>
        service.service.replace(/\W+|_|-/g, '').toLocaleLowerCase() ==
        serviceName.toLocaleLowerCase()
    )

    if (oauthVersion) {
      return { ...oauthVersion, supportsOAuth: true }
    }

    return {
      service: serviceName,
      supportsOAuth: false,
    }
  })
}

export const serviceId = (service: APIService | GraphQLService): string => {
  return service.service
}

export const fetchIntegrationStatus = async (): Promise<Database> => {
  const resp = await fetch('/.netlify/functions/integrationStatus')
  const text = await resp.text()
  return JSON.parse(text)
}

export const setIntegrationStatus = async (database: Database) => {
  const resp = await fetch('/.netlify/functions/updateIntegrations', {
    method: 'POST',
    body: JSON.stringify(database),
  })
  const text = await resp.text()
  return JSON.parse(text)
}

export const fetchCommunityFunctions = async (
  schema: GraphQLSchema
): Promise<Array<CommunityFunction>> => {
  const resp = await fetch('/.netlify/functions/communityFunctions')
  const text = await resp.text()
  const communityFunctions: Array<SerializedCommunityFunction> =
    JSON.parse(text)

  return communityFunctions
    .map((fn) => {
      const parsed = parse(fn.definition)
      const operation: DefinitionNode | undefined = parsed.definitions.find(
        (definition) => definition.kind === 'OperationDefinition'
      )

      if (!operation || operation.kind !== 'OperationDefinition') {
        return
      }

      const name = operation.name?.value || 'Unknown'
      const services = gatherAllReferencedServices(schema, operation)
      const variables = gatherVariableDefinitions(operation)

      return { ...fn, services, variables, name }
    })
    .filter(notEmpty)
}

type NewNetlifyFunction = {
  functionName: string
  source: string
}

export const saveNetlifyFunctions = async (
  newFunctions: Array<NewNetlifyFunction>
) => {
  const resp = await fetch('/.netlify/functions/saveNetlifyFunctions', {
    method: 'POST',
    body: JSON.stringify({ functions: newFunctions }),
  })
  const text = await resp.text()
  return JSON.parse(text)
}

export const editFunctionLibrary = async (
  newFunction: SerializedCommunityFunction
) => {
  const resp = await fetch('/.netlify/functions/editFunctionLibrary', {
    method: 'POST',
    body: JSON.stringify({ function: newFunction }),
  })
  const text = await resp.text()
  return JSON.parse(text)
}

export async function fetchSchemas() {
  const response = await fetch('/.netlify/functions/netligraphMeta', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  const responseBody = await response.text()

  try {
    return JSON.parse(responseBody)
  } catch (e) {
    console.warn(e)
    return responseBody
  }
}

/**
 * Some implementation hacks on the frontend to simulate work
 * OneGraph would do on its own in a deeper integration
 */
export type GraphQLService = {
  friendlyServiceName: string
  service: string
  slug: string
  supportsCustomServiceAuth: boolean
  supportsOauthLogin: boolean
  simpleSlug: string
}

export const services: Array<GraphQLService> = [
  {
    service: 'ADROLL',
    friendlyServiceName: 'Adroll',
    slug: 'adroll',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'adroll',
  },
  {
    service: 'ASANA',
    friendlyServiceName: 'Asana',
    slug: 'asana',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'asana',
  },
  {
    service: 'BOX',
    friendlyServiceName: 'Box',
    slug: 'box',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'box',
  },
  {
    service: 'DEV_TO',
    friendlyServiceName: 'Dev.to',
    slug: 'dev-to',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: false,
    simpleSlug: 'devto',
  },
  {
    service: 'DRIBBBLE',
    friendlyServiceName: 'Dribbble',
    slug: 'dribbble',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'dribbble',
  },
  {
    service: 'DROPBOX',
    friendlyServiceName: 'Dropbox',
    slug: 'dropbox',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'dropbox',
  },
  {
    service: 'CONTENTFUL',
    friendlyServiceName: 'Contentful',
    slug: 'contentful',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'contentful',
  },
  {
    service: 'EGGHEADIO',
    friendlyServiceName: 'Egghead.io',
    slug: 'eggheadio',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'eggheadio',
  },
  {
    service: 'EVENTIL',
    friendlyServiceName: 'Eventil',
    slug: 'eventil',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'eventil',
  },
  {
    service: 'FACEBOOK',
    friendlyServiceName: 'Facebook',
    slug: 'facebook',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'facebook',
  },
  {
    service: 'FIREBASE',
    friendlyServiceName: 'Firebase',
    slug: 'firebase',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'firebase',
  },
  {
    service: 'GITHUB',
    friendlyServiceName: 'GitHub',
    slug: 'github',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'github',
  },
  {
    service: 'GMAIL',
    friendlyServiceName: 'Gmail',
    slug: 'gmail',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'gmail',
  },
  {
    service: 'GOOGLE',
    friendlyServiceName: 'Google',
    slug: 'google',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: false,
    simpleSlug: 'google',
  },
  {
    service: 'GOOGLE_ADS',
    friendlyServiceName: 'Google Ads',
    slug: 'google-ads',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googleads',
  },
  {
    service: 'GOOGLE_ANALYTICS',
    friendlyServiceName: 'Google Analytics',
    slug: 'google-analytics',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googleanalytics',
  },
  {
    service: 'GOOGLE_CALENDAR',
    friendlyServiceName: 'Google Calendar',
    slug: 'google-calendar',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googlecalendar',
  },
  {
    service: 'GOOGLE_COMPUTE',
    friendlyServiceName: 'Google Compute',
    slug: 'google-compute',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googlecompute',
  },
  {
    service: 'GOOGLE_DOCS',
    friendlyServiceName: 'Google Docs',
    slug: 'google-docs',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googledocs',
  },
  {
    service: 'GOOGLE_SEARCH_CONSOLE',
    friendlyServiceName: 'Google Search Console',
    slug: 'google-search-console',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googlesearchconsole',
  },
  {
    service: 'GOOGLE_TRANSLATE',
    friendlyServiceName: 'Google Translate',
    slug: 'google-translate',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'googletranslate',
  },
  {
    service: 'HUBSPOT',
    friendlyServiceName: 'Hubspot',
    slug: 'hubspot',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'hubspot',
  },
  {
    service: 'INTERCOM',
    friendlyServiceName: 'Intercom',
    slug: 'intercom',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'intercom',
  },
  {
    service: 'MAILCHIMP',
    friendlyServiceName: 'Mailchimp',
    slug: 'mailchimp',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'mailchimp',
  },
  {
    service: 'MEETUP',
    friendlyServiceName: 'Meetup',
    slug: 'meetup',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'meetup',
  },
  {
    service: 'NETLIFY',
    friendlyServiceName: 'Netlify',
    slug: 'netlify',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'netlify',
  },
  {
    service: 'PRODUCT_HUNT',
    friendlyServiceName: 'Product Hunt',
    slug: 'product-hunt',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: false,
    simpleSlug: 'producthunt',
  },
  {
    service: 'QUICKBOOKS',
    friendlyServiceName: 'QuickBooks',
    slug: 'quickbooks',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'quickbooks',
  },
  {
    service: 'SALESFORCE',
    friendlyServiceName: 'Salesforce',
    slug: 'salesforce',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'salesforce',
  },
  {
    service: 'SLACK',
    friendlyServiceName: 'Slack',
    slug: 'slack',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'slack',
  },
  {
    service: 'SPOTIFY',
    friendlyServiceName: 'Spotify',
    slug: 'spotify',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'spotify',
  },
  {
    service: 'STRIPE',
    friendlyServiceName: 'Stripe',
    slug: 'stripe',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'stripe',
  },
  {
    service: 'TRELLO',
    friendlyServiceName: 'Trello',
    slug: 'trello',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'trello',
  },
  {
    service: 'TWILIO',
    friendlyServiceName: 'Twilio',
    slug: 'twilio',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'twilio',
  },
  {
    service: 'TWITTER',
    friendlyServiceName: 'Twitter',
    slug: 'twitter',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'twitter',
  },
  {
    service: 'TWITCH_TV',
    friendlyServiceName: 'Twitch',
    slug: 'twitch-tv',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'twitchtv',
  },
  {
    service: 'YNAB',
    friendlyServiceName: 'You Need a Budget',
    slug: 'ynab',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'ynab',
  },
  {
    service: 'YOUTUBE',
    friendlyServiceName: 'YouTube',
    slug: 'youtube',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'youtube',
  },
  {
    service: 'ZEIT',
    friendlyServiceName: 'Vercel',
    slug: 'zeit',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'zeit',
  },
  {
    service: 'ZENDESK',
    friendlyServiceName: 'Zendesk',
    slug: 'zendesk',
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true,
    simpleSlug: 'zendesk',
  },
  {
    service: 'AIRTABLE',
    friendlyServiceName: 'Airtable',
    slug: 'airtable',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'airtable',
  },
  {
    service: 'APOLLO',
    friendlyServiceName: 'Apollo',
    slug: 'apollo',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'apollo',
  },
  {
    service: 'BREX',
    friendlyServiceName: 'Brex',
    slug: 'brex',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'brex',
  },
  {
    service: 'BUNDLEPHOBIA',
    friendlyServiceName: 'Bundlephobia',
    slug: 'bundlephobia',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'bundlephobia',
  },
  {
    service: 'CLEARBIT',
    friendlyServiceName: 'Clearbit',
    slug: 'clearbit',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'clearbit',
  },
  {
    service: 'CLOUDFLARE',
    friendlyServiceName: 'Cloudflare',
    slug: 'cloudflare',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'cloudflare',
  },
  {
    service: 'CRUNCHBASE',
    friendlyServiceName: 'Crunchbase',
    slug: 'crunchbase',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'crunchbase',
  },
  {
    service: 'FEDEX',
    friendlyServiceName: 'Fedex',
    slug: 'fedex',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'fedex',
  },
  {
    service: 'GOOGLE_MAPS',
    friendlyServiceName: 'Google Maps',
    slug: 'google-maps',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'googlemaps',
  },
  {
    service: 'GRAPHCMS',
    friendlyServiceName: 'GraphCMS',
    slug: 'graphcms',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'graphcms',
  },
  {
    service: 'IMMIGRATION_GRAPH',
    friendlyServiceName: 'Immigration Graph',
    slug: 'immigration-graph',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'immigrationgraph',
  },
  {
    service: 'LOGDNA',
    friendlyServiceName: 'LogDNA',
    slug: 'logdna',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'logdna',
  },
  {
    service: 'MIXPANEL',
    friendlyServiceName: 'Mixpanel',
    slug: 'mixpanel',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'mixpanel',
  },
  {
    service: 'MUX',
    friendlyServiceName: 'Mux',
    slug: 'mux',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'mux',
  },
  {
    service: 'NPM',
    friendlyServiceName: 'Npm',
    slug: 'npm',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'npm',
  },
  {
    service: 'ONEGRAPH',
    friendlyServiceName: 'OneGraph',
    slug: 'onegraph',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'onegraph',
  },
  {
    service: 'ORBIT',
    friendlyServiceName: 'Orbit',
    slug: 'orbit',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'orbit',
  },
  {
    service: 'OPEN_COLLECTIVE',
    friendlyServiceName: 'OpenCollective',
    slug: 'open-collective',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'opencollective',
  },
  {
    service: 'UPS',
    friendlyServiceName: 'UPS',
    slug: 'ups',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'ups',
  },
  {
    service: 'USPS',
    friendlyServiceName: 'USPS',
    slug: 'usps',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'usps',
  },
  {
    service: 'WORDPRESS',
    friendlyServiceName: 'Wordpress',
    slug: 'wordpress',
    supportsOauthLogin: false,
    supportsCustomServiceAuth: false,
    simpleSlug: 'wordpress',
  },
]

export function gatherAllReferencedTypes(
  schema: GraphQLSchema,
  query: OperationDefinitionNode
): Array<string> {
  const types = new Set<string>([])
  const typeInfo = new TypeInfo(schema)
  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      enter: () => {
        const fullType = typeInfo.getType()
        if (!!fullType) {
          const typ = getNamedType(fullType)
          if (typ) types.add(typ.name.toLocaleLowerCase().replace('oneme', ''))
        }
      },
    })
  )

  const result = Array.from(types)
  return result
}
export function gatherAllReferencedServices(
  schema: GraphQLSchema,
  query: OperationDefinitionNode
) {
  const referencedTypes = gatherAllReferencedTypes(schema, query)
  const referencedServices: Set<GraphQLService> = new Set([])

  referencedTypes.forEach((typeName) => {
    services.forEach((service) => {
      if (typeName.startsWith(service.simpleSlug)) {
        referencedServices.add(service)
      }
    })
  })

  return Array.from(referencedServices)
}

export function gatherVariableDefinitions(
  definition: OperationDefinitionNode
): Array<[string, string]> {
  const extract = (varDef: VariableDefinitionNode): [string, string] => [
    varDef.variable.name.value,
    print(varDef.type),
  ]

  return (definition?.variableDefinitions?.map(extract) || []).sort(
    ([a], [b]) => a.localeCompare(b)
  )
}
