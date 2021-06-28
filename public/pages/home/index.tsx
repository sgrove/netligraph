import React, { useState, useEffect, useCallback } from 'react'
// @ts-ignore: No typescript defs
import OneGraphAuth from 'onegraph-auth'
import {
  fetchAllServices,
  serviceImageUrl,
  Service,
  combineAllServices,
  serviceId,
  APIService,
  OAuthService,
} from '../../frontendHelpers'

const ONEGRAPH_APP_ID = process.env.ONEGRAPH_APP_ID

export type Database = {
  accessToken: string | null
  manuallyEnabledServices: Array<string>
  loggedInServices: Array<string>
}

const fetchIntegrationStatus = async (): Promise<Database> => {
  const resp = await fetch('/.netlify/functions/integrationStatus')
  const text = await resp.text()
  return JSON.parse(text)
}

const setIntegrationStatus = async (database: Database) => {
  const resp = await fetch('/.netlify/functions/updateIntegrations', {
    method: 'POST',
    body: JSON.stringify(database),
  })
  const text = await resp.text()
  return JSON.parse(text)
}

const blocklist = new Set([
  'gmail',
  'google',
  'google-calendar',
  'google-compute',
  'google-docs',
  'google-translate',
  'zeit',
  'emailNode',
  'me',
  'oneGraphNode',
  'immigrationGraph',
  'descuri',
  'youTubeSearch',
  'youTubeVideo',
])

type State = {
  database: Database
  services: Array<APIService>
  search: string | null
}

type OAuthServiceEntryProps = {
  service: OAuthService
  enabled: boolean
  loggedIn: boolean
  disableIntegration: (service: OAuthService) => void
  enableIntegration: (service: OAuthService) => void
  doLogin: (service: OAuthService) => void
  doLogout: (service: OAuthService) => void
}
const OAuthServiceEntry = ({
  service,
  enabled,
  disableIntegration,
  enableIntegration,
  doLogin,
  doLogout,
  loggedIn,
}: OAuthServiceEntryProps) => {
  return (
    <>
      <a href="/graphiql">
        <img
          alt={`${service.service} Logomark`}
          // @ts-ignore: Safe
          src={serviceImageUrl(service.service)}
          style={{
            width: '50px',
            borderRadius: '6px',
            marginRight: '6px',
          }}
        />
      </a>
      <div style={{ flexGrow: 1 }}>
        <h3>
          <a>{service.friendlyServiceName} API</a>
        </h3>
        {enabled ? (
          <p className="meta">
            <time
              dateTime="2022-03-16T21:17:00.000Z"
              title="Wed, Mar 16, 2022 at 2:17&nbsp;PM"
              aria-label="Auto-renews on Mar&nbsp;16,&nbsp;2022"
            >
              Installed on June&nbsp;16,&nbsp;2021
            </time>
          </p>
        ) : (
          ' '
        )}
      </div>
      <div>
        {!enabled ? null : (
          <button
            className={
              'btn btn-default btn-primary btn-primary--standard ' +
              (loggedIn ? 'btn-primary--danger ' : ' ')
            }
            type="button"
            style={{ alignSelf: 'end', marginRight: '6px' }}
            onClick={() => {
              loggedIn ? doLogout(service) : doLogin(service)
            }}
          >
            {loggedIn ? 'Destroy ' : 'Set '} auth
          </button>
        )}

        <button
          className={
            'btn btn-default btn-primary btn-primary--standard ' +
            (enabled ? 'btn-primary--danger ' : ' ')
          }
          type="button"
          style={{ alignSelf: 'end' }}
          onClick={() => {
            enabled ? disableIntegration(service) : enableIntegration(service)
          }}
        >
          {enabled ? 'Deactivate ' : 'Activate '}
          integration
        </button>
      </div>
    </>
  )
}

type ServiceEntryProps = {
  service: Service
  enabled: boolean
  disableIntegration: (service: APIService) => void
  enableIntegration: (service: APIService) => void
}
const ServiceEntry = ({
  service,
  enabled,
  disableIntegration,
  enableIntegration,
}: ServiceEntryProps) => {
  return (
    <>
      <a href="/graphiql">
        <img
          alt={`${service.service} Logomark`}
          // @ts-ignore: Safe
          src={serviceImageUrl(service.service)}
          style={{
            width: '50px',
            borderRadius: '6px',
            marginRight: '6px',
          }}
        />
      </a>
      <div style={{ flexGrow: 1 }}>
        <h3>
          <a>{service.service} API</a>
        </h3>
        {enabled ? (
          <p className="meta">
            <time
              dateTime="2022-03-16T21:17:00.000Z"
              title="Wed, Mar 16, 2022 at 2:17&nbsp;PM"
              aria-label="Auto-renews on Mar&nbsp;16,&nbsp;2022"
            >
              Installed on June&nbsp;16,&nbsp;2021
            </time>
          </p>
        ) : (
          ' '
        )}
      </div>
      <div>
        <button
          className={
            'btn btn-default btn-primary btn-primary--standard ' +
            (enabled ? 'btn-primary--danger ' : ' ')
          }
          type="button"
          style={{ alignSelf: 'end' }}
          onClick={() => {
            enabled ? disableIntegration(service) : enableIntegration(service)
          }}
        >
          {enabled ? 'Dectivate ' : 'Activate '}
          integration
        </button>
      </div>
    </>
  )
}

export default function Home() {
  const [token, setToken] = useState('')
  const [auth, setAuth] = useState<OneGraphAuth>(
    new OneGraphAuth({
      appId: ONEGRAPH_APP_ID,
    })
  )
  const [servicesStatus, setServicesStatus] = useState({})
  const [state, setState] = useState<State>({
    services: [],
    database: {
      loggedInServices: [],
      accessToken: null,
      manuallyEnabledServices: [],
    },
    search: null,
  })

  useEffect(() => {
    if (!auth) {
      return
    }

    // @ts-ignore: Safe
    const token = auth?.accessToken()

    token ? setToken(token.accessToken) : null
  }, [auth])

  useEffect(() => {
    fetchIntegrationStatus().then((database) => {
      setState((oldState) => ({ ...oldState, database }))
    })
  }, [])

  useEffect(() => {
    const helper = async () => {
      const oauthServicesPromise = auth
        ?.allServices()
        ?.then((services: Array<Service>) => {
          return services
        })

      const serviceFieldsPromise = fetchAllServices().then((services) => {
        return services
      })

      const oauthServices = await oauthServicesPromise
      const serviceFields = await serviceFieldsPromise

      const services = combineAllServices(serviceFields, oauthServices)

      setState((oldState) => ({ ...oldState, services }))
    }

    helper()
  }, [auth])

  const doLogin = async (service: OAuthService) => {
    // @ts-ignore: Safe
    await auth.login(service.service)
    const newDatabase: Database = {
      ...state.database,
      accessToken: auth.accessToken()?.accessToken,
    }
    const serverDatabase = await setIntegrationStatus(newDatabase)
    setState((oldState) => ({ ...oldState, database: serverDatabase }))
  }

  const doLogout = async (service: OAuthService) => {
    // @ts-ignore: Safe
    await auth.logout(service.service)

    const newDatabase: Database = {
      ...state.database,
      accessToken: auth.accessToken()?.accessToken,
    }
    const serverDatabase = await setIntegrationStatus(newDatabase)
    setState((oldState) => ({ ...oldState, database: serverDatabase }))
  }

  const enableIntegration = async (service: APIService) => {
    const manuallyEnabledServices = [
      ...state.database.manuallyEnabledServices,
      serviceId(service),
    ].filter((v, i, a) => a.indexOf(v) === i)
    const newDatabase: Database = {
      ...state.database,
      manuallyEnabledServices,
    }
    const serverDatabase = await setIntegrationStatus(newDatabase)
    setState((oldState) => ({ ...oldState, database: serverDatabase }))
  }

  const disableIntegration = async (service: APIService) => {
    const manuallyEnabledServices =
      state.database.manuallyEnabledServices.filter(
        (v) => serviceId(service) !== v
      )

    if (service.supportsOAuth) {
      // @ts-ignore: Safe
      await auth.logout(service.service)
    }

    const newDatabase: Database = {
      ...state.database,
      accessToken: auth.accessToken()?.accessToken,
      manuallyEnabledServices,
    }
    const serverDatabase = await setIntegrationStatus(newDatabase)
    setState((oldState) => ({ ...oldState, database: serverDatabase }))
  }

  const dataURI = token
    ? `data:text/plain;charset=utf-8,${encodeURIComponent(
        `ONEGRAPH_TOKEN=${token}`
      )}`
    : null

  return (
    <>
      <input
        style={{ width: '100%' }}
        placeholder="Search"
        onChange={(event) => {
          let value: string | null = event.target.value.trim()
          if (value === '') {
            value = null
          }

          setState((oldState) => ({ ...oldState, search: value }))
        }}
      />
      <ul className="table-body">
        {state.services
          .filter((service) => {
            if (state.search === null) {
              return true
            }
            return !!serviceId(service)
              .toLocaleLowerCase()
              .match(state.search.toLocaleLowerCase())
          })
          .sort((a, b) => {
            return serviceId(a).localeCompare(serviceId(b))
          })
          .map((service) => {
            if (blocklist.has(service.service)) {
              return
            }
            const loggedIn = service.supportsOAuth
              ? state.database.loggedInServices.includes(service.serviceEnum)
              : false

            const enabled = state.database.manuallyEnabledServices.includes(
              serviceId(service)
            )

            return (
              <li key={serviceId(service)} style={{ display: 'flex' }}>
                {service.supportsOAuth ? (
                  <OAuthServiceEntry
                    service={service}
                    enabled={enabled}
                    disableIntegration={disableIntegration}
                    enableIntegration={enableIntegration}
                    loggedIn={loggedIn}
                    doLogin={doLogin}
                    doLogout={doLogout}
                  />
                ) : (
                  <ServiceEntry
                    service={service}
                    enabled={enabled}
                    disableIntegration={disableIntegration}
                    enableIntegration={enableIntegration}
                  />
                )}
              </li>
            )
          })}
      </ul>

      {token && (
        <>
          <p>
            <input value="ONEGRAPH_TOKEN" readOnly />
            <input value={token} readOnly />
          </p>
          <p>
            <input
              value={`netlify env:set ONEGRAPH_TOKEN "${token}"`}
              readOnly
              style={{ minWidth: '50%', fontFamily: 'monospace' }}
            />
          </p>
          <p>
            Copy or download the token <em>after</em> logging-in to all required
            services, as the token changes.{' '}
          </p>
          <p>
            {
              // @ts-ignore: Safe
              <a href={dataURI} download="netlify.env">
                Download .env file
              </a>
            }{' '}
          </p>
        </>
      )}
    </>
  )
}
