import {
  getNamedType,
  GraphQLSchema,
  visit,
  visitWithTypeInfo,
  OperationDefinitionNode,
  TypeInfo,
} from 'graphql'

export type Service = {
  friendlyServiceName: string
  service: string
  slug: string
  supportsCustomServiceAuth: boolean
  supportsOauthLogin: boolean
  simpleSlug: string
}

export const services: Array<Service> = [
  {
    friendlyServiceName: 'Adroll',
    service: 'ADROLL',
    slug: 'adroll',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'adroll',
  },
  {
    friendlyServiceName: 'Box',
    service: 'BOX',
    slug: 'box',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'box',
  },
  {
    friendlyServiceName: 'Dev.to',
    service: 'DEV_TO',
    slug: 'dev-to',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: true,
    simpleSlug: 'devto',
  },
  {
    friendlyServiceName: 'Dribbble',
    service: 'DRIBBBLE',
    slug: 'dribbble',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'dribbble',
  },
  {
    friendlyServiceName: 'Dropbox',
    service: 'DROPBOX',
    slug: 'dropbox',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'dropbox',
  },
  {
    friendlyServiceName: 'Contentful',
    service: 'CONTENTFUL',
    slug: 'contentful',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'contentful',
  },
  {
    friendlyServiceName: 'Egghead.io',
    service: 'EGGHEADIO',
    slug: 'eggheadio',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'eggheadio',
  },
  {
    friendlyServiceName: 'Eventil',
    service: 'EVENTIL',
    slug: 'eventil',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'eventil',
  },
  {
    friendlyServiceName: 'Facebook',
    service: 'FACEBOOK',
    slug: 'facebook',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'facebook',
  },
  {
    friendlyServiceName: 'Firebase',
    service: 'FIREBASE',
    slug: 'firebase',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'firebase',
  },
  {
    friendlyServiceName: 'GitHub',
    service: 'GITHUB',
    slug: 'github',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'github',
  },
  {
    friendlyServiceName: 'Gmail',
    service: 'GMAIL',
    slug: 'gmail',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'gmail',
  },

  {
    friendlyServiceName: 'Google Ads',
    service: 'GOOGLE_ADS',
    slug: 'google-ads',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googleads',
  },
  {
    friendlyServiceName: 'Google Analytics',
    service: 'GOOGLE_ANALYTICS',
    slug: 'google-analytics',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googleanalytics',
  },
  {
    friendlyServiceName: 'Google Calendar',
    service: 'GOOGLE_CALENDAR',
    slug: 'google-calendar',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googlecalendar',
  },
  {
    friendlyServiceName: 'Google Compute',
    service: 'GOOGLE_COMPUTE',
    slug: 'google-compute',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googlecompute',
  },
  {
    friendlyServiceName: 'Google Docs',
    service: 'GOOGLE_DOCS',
    slug: 'google-docs',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googledocs',
  },
  {
    friendlyServiceName: 'Google Search Console',
    service: 'GOOGLE_SEARCH_CONSOLE',
    slug: 'google-search-console',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googlesearchconsole',
  },
  {
    friendlyServiceName: 'Google Translate',
    service: 'GOOGLE_TRANSLATE',
    slug: 'google-translate',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'googletranslate',
  },
  {
    friendlyServiceName: 'Google',
    service: 'GOOGLE',
    slug: 'google',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: true,
    simpleSlug: 'google',
  },
  {
    friendlyServiceName: 'Hubspot',
    service: 'HUBSPOT',
    slug: 'hubspot',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'hubspot',
  },
  {
    friendlyServiceName: 'Intercom',
    service: 'INTERCOM',
    slug: 'intercom',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'intercom',
  },
  {
    friendlyServiceName: 'Mailchimp',
    service: 'MAILCHIMP',
    slug: 'mailchimp',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'mailchimp',
  },
  {
    friendlyServiceName: 'Meetup',
    service: 'MEETUP',
    slug: 'meetup',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'meetup',
  },
  {
    friendlyServiceName: 'Netlify',
    service: 'NETLIFY',
    slug: 'netlify',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'netlify',
  },
  {
    friendlyServiceName: 'Product Hunt',
    service: 'PRODUCT_HUNT',
    slug: 'product-hunt',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: true,
    simpleSlug: 'producthunt',
  },
  {
    friendlyServiceName: 'QuickBooks',
    service: 'QUICKBOOKS',
    slug: 'quickbooks',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'quickbooks',
  },
  {
    friendlyServiceName: 'Salesforce',
    service: 'SALESFORCE',
    slug: 'salesforce',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'salesforce',
  },
  {
    friendlyServiceName: 'Slack',
    service: 'SLACK',
    slug: 'slack',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'slack',
  },
  {
    friendlyServiceName: 'Spotify',
    service: 'SPOTIFY',
    slug: 'spotify',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'spotify',
  },
  {
    friendlyServiceName: 'Stripe',
    service: 'STRIPE',
    slug: 'stripe',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'stripe',
  },
  {
    friendlyServiceName: 'Trello',
    service: 'TRELLO',
    slug: 'trello',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'trello',
  },
  {
    friendlyServiceName: 'Twilio',
    service: 'TWILIO',
    slug: 'twilio',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'twilio',
  },
  {
    friendlyServiceName: 'Twitter',
    service: 'TWITTER',
    slug: 'twitter',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'twitter',
  },
  {
    friendlyServiceName: 'Twitch',
    service: 'TWITCH_TV',
    slug: 'twitch-tv',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'twitchtv',
  },
  {
    friendlyServiceName: 'You Need a Budget',
    service: 'YNAB',
    slug: 'ynab',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'ynab',
  },
  {
    friendlyServiceName: 'YouTube',
    service: 'YOUTUBE',
    slug: 'youtube',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'youtube',
  },
  {
    friendlyServiceName: 'Vercel',
    service: 'ZEIT',
    slug: 'zeit',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'zeit',
  },
  {
    friendlyServiceName: 'Zendesk',
    service: 'ZENDESK',
    slug: 'zendesk',
    supportsCustomServiceAuth: true,
    supportsOauthLogin: true,
    simpleSlug: 'zendesk',
  },
  {
    friendlyServiceName: 'Airtable',
    service: 'AIRTABLE',
    slug: 'airtable',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'airtable',
  },
  {
    friendlyServiceName: 'Apollo',
    service: 'APOLLO',
    slug: 'apollo',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'apollo',
  },
  {
    friendlyServiceName: 'Brex',
    service: 'BREX',
    slug: 'brex',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'brex',
  },
  {
    friendlyServiceName: 'Bundlephobia',
    service: 'BUNDLEPHOBIA',
    slug: 'bundlephobia',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'bundlephobia',
  },
  {
    friendlyServiceName: 'Clearbit',
    service: 'CLEARBIT',
    slug: 'clearbit',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'clearbit',
  },
  {
    friendlyServiceName: 'Cloudflare',
    service: 'CLOUDFLARE',
    slug: 'cloudflare',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'cloudflare',
  },
  {
    friendlyServiceName: 'Crunchbase',
    service: 'CRUNCHBASE',
    slug: 'crunchbase',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'crunchbase',
  },
  {
    friendlyServiceName: 'Fedex',
    service: 'FEDEX',
    slug: 'fedex',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'fedex',
  },
  {
    friendlyServiceName: 'Google Maps',
    service: 'GOOGLE_MAPS',
    slug: 'google-maps',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'googlemaps',
  },
  {
    friendlyServiceName: 'GraphCMS',
    service: 'GRAPHCMS',
    slug: 'graphcms',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'graphcms',
  },
  {
    friendlyServiceName: 'Immigration Graph',
    service: 'IMMIGRATION_GRAPH',
    slug: 'immigration-graph',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'immigrationgraph',
  },
  {
    friendlyServiceName: 'LogDNA',
    service: 'LOGDNA',
    slug: 'logdna',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'logdna',
  },
  {
    friendlyServiceName: 'Mixpanel',
    service: 'MIXPANEL',
    slug: 'mixpanel',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'mixpanel',
  },
  {
    friendlyServiceName: 'Mux',
    service: 'MUX',
    slug: 'mux',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'mux',
  },
  {
    friendlyServiceName: 'Npm',
    service: 'NPM',
    slug: 'npm',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'npm',
  },
  {
    friendlyServiceName: 'OneGraph',
    service: 'ONEGRAPH',
    slug: 'onegraph',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'onegraph',
  },
  {
    friendlyServiceName: 'Orbit',
    service: 'ORBIT',
    slug: 'orbit',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'orbit',
  },
  {
    friendlyServiceName: 'OpenCollective',
    service: 'OPEN_COLLECTIVE',
    slug: 'open-collective',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'opencollective',
  },
  {
    friendlyServiceName: 'UPS',
    service: 'UPS',
    slug: 'ups',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'ups',
  },
  {
    friendlyServiceName: 'USPS',
    service: 'USPS',
    slug: 'usps',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'usps',
  },
  {
    friendlyServiceName: 'Wordpress',
    service: 'WORDPRESS',
    slug: 'wordpress',
    supportsCustomServiceAuth: false,
    supportsOauthLogin: false,
    simpleSlug: 'wordpress',
  },
]

export function gatherAllReferencedTypes(
  schema: GraphQLSchema,
  query: OperationDefinitionNode
) {
  const types = new Set([])
  const typeInfo = new TypeInfo(schema)
  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      enter: () => {
        const fullType = typeInfo.getType()
        if (!fullType) {
          // @ts-ignore
          const typ = getNamedType(fullType)
          // @ts-ignore
          if (typ) types.add(typ.name.toLocaleLowerCase().replace('oneme', ''))
        }
      },
    })
  )

  // @ts-ignore
  return [...types]
}
export function gatherAllReferencedServices(
  schema: GraphQLSchema,
  query: OperationDefinitionNode
) {
  const referencedTypes = gatherAllReferencedTypes(schema, query)

  const referencedServices: Set<Service> = new Set([])

  referencedTypes.forEach((typeName) => {
    services.forEach((service) => {
      if (typeName.startsWith(service.simpleSlug)) {
        referencedServices.add(service)
      }
    })
  })

  // @ts-ignore
  return [...referencedServices]
}
