import { Database } from './pages/home'

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

export const serviceImageUrl = (service: Keys, size = 25) => {
  const lookup = ServiceLookup[service]
  if (!lookup) {
    return '//logo.clearbit.com/netlify'
  }

  return `//logo.clearbit.com/${lookup[0]}?size=${size}`
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

export const serviceId = (service: APIService): string => {
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
