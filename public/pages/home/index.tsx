import React, { useState, useEffect } from 'react'
import {
  addLeftWhitespace,
  // @ts-ignore: No typescript defs
} from '@sgrove/graphiql-code-exporter/lib/utils/index'
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
  fetchIntegrationStatus,
  setIntegrationStatus,
  fetchSchemas,
  GraphQLService,
  fetchCommunityFunctions,
  graphqlFetcher,
  makeAuth,
} from '../../frontendHelpers'
import { buildASTSchema, parse } from 'graphql'
import ReactMarkdown from 'react-markdown'
import { GraphQLSchema } from 'graphql'
import { formInput } from './graphqlForm'
import { OperationDefinitionNode } from 'graphql'

export type CommunityFunction = {
  id: string
  definition: string
  description: string
  name: string
  variables: Array<[string, string]>
  services: Array<GraphQLService>
}

const ONEGRAPH_APP_ID = process.env.ONEGRAPH_APP_ID

export type Database = {
  accessToken: string | null
  manuallyEnabledServices: Array<string>
  loggedInServices: Array<string>
  installedFunctionIds: Array<string>
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
  fullSchema: GraphQLSchema | null
  communityFunctions: Array<CommunityFunction>
  openServices: Array<string>
  installedFunctionIds: Array<string>
}

type OAuthServiceEntryProps = {
  service: OAuthService
  enabled: boolean
  loggedIn: boolean
  disableIntegration: (service: OAuthService) => void
  enableIntegration: (service: OAuthService) => void
  doLogin: (service: OAuthService) => void
  doLogout: (service: OAuthService) => void
  hasFunctions: boolean
  onToggleFunctions: () => void
}
const OAuthServiceEntry = ({
  service,
  enabled,
  disableIntegration,
  enableIntegration,
  doLogin,
  doLogout,
  loggedIn,
  hasFunctions,
  onToggleFunctions,
}: OAuthServiceEntryProps) => {
  return (
    <>
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
      {!hasFunctions ? null : (
        <div className="dropdown" aria-expanded="false" aria-haspopup="listbox">
          <button
            role="button"
            aria-label="Options. Open menu"
            aria-haspopup="true"
            data-toggle="true"
            name="Options"
            className={'btn btn-default btn-secondary btn-secondary--standard '}
            type="button"
            style={{ alignSelf: 'end', marginRight: '6px' }}
            onClick={onToggleFunctions}
          >
            Functions
            <svg
              height={12}
              viewBox="0 0 16 16"
              width={12}
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="tw-transition-transform tw-duration-100 tw-ease-cubic-bezier tw-align-middle tw-inline-block tw--mt-[2px] tw-ml-1"
            >
              <path d="M4 4l3.4 3.4c.3.4.9.4 1.2 0L11.9 4 14 6.2l-5.4 5.6c-.3.3-.9.3-1.2 0L2 6.2z" />
            </svg>
          </button>
        </div>
      )}
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
  hasFunctions: boolean
  onToggleFunctions: () => void
}
const ServiceEntry = ({
  service,
  enabled,
  disableIntegration,
  enableIntegration,
  hasFunctions,
  onToggleFunctions,
}: ServiceEntryProps) => {
  return (
    <>
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
      {!hasFunctions ? null : (
        <div className="dropdown" aria-expanded="false" aria-haspopup="listbox">
          <button
            role="button"
            aria-label="Options. Open menu"
            aria-haspopup="true"
            data-toggle="true"
            name="Options"
            className={'btn btn-default btn-secondary btn-secondary--standard '}
            type="button"
            style={{ alignSelf: 'end', marginRight: '6px' }}
            onClick={onToggleFunctions}
          >
            Functions
            <svg
              height={12}
              viewBox="0 0 16 16"
              width={12}
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="tw-transition-transform tw-duration-100 tw-ease-cubic-bezier tw-align-middle tw-inline-block tw--mt-[2px] tw-ml-1"
            >
              <path d="M4 4l3.4 3.4c.3.4.9.4 1.2 0L11.9 4 14 6.2l-5.4 5.6c-.3.3-.9.3-1.2 0L2 6.2z" />
            </svg>
          </button>
        </div>
      )}
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

const FunctionPreview = ({
  communityFunction,
  schema,
  onClose,
  isOpen,
  isEnabled,
}: {
  communityFunction: CommunityFunction
  schema: GraphQLSchema
  onClose: () => void
  isOpen: boolean
  isEnabled: boolean
}) => {
  const [auth, setAuth] = useState<OneGraphAuth>(
    makeAuth({
      appId: ONEGRAPH_APP_ID,
    })
  )
  const [formVariables, setFormVariables] = useState({})
  const [results, setResults] = useState(null)
  const operations = parse(communityFunction.definition).definitions

  const operation = operations.find(
    (operation) => operation.kind === 'OperationDefinition'
  )

  if (!operation || operation.kind !== 'OperationDefinition') {
    return null
  }

  const variables = operation.variableDefinitions || []

  const operationName = operation.name?.value || 'Unknown'

  const base = `const { data, errors } = await  netligraph.functions.${operationName}(`

  const usagePreview = `
${base}
${addLeftWhitespace(JSON.stringify(formVariables, null, 2), base.length)})`

  const form = variables.map((variable) => {
    return (
      <div
        className="tw-c-form-field tw-mt-3"
        key={variable.variable.name.value}
      >
        <label>
          <div className="tw-c-form-field-label tw-text-xs tw-text-gray-darker dark:tw-text-gray-lighter tw-cursor-pointer tw-font-normal tw-leading-very-chill">
            {variable.variable.name.value}
          </div>

          <div>{formInput(schema, variable, setFormVariables, {})}</div>
        </label>
      </div>
    )
  })

  if (!isOpen) {
    return null
  }

  const submit = async (event: any) => {
    event.preventDefault()
    event.stopPropagation()
    let fetchResults = await graphqlFetcher(auth, {
      query: communityFunction.definition,
      operationName: operation.name?.value || undefined,
      variables: formVariables,
    })

    setResults(fetchResults)
  }

  return (
    <div style={{ display: 'flex' }}>
      <section className="card card-settings" tabIndex={-1}>
        <form className="floating-labels">
          <div className="table-body">{form}</div>
          <div className="tw-flex tw-flex-wrap tw-actions-flex-gap-2 tw-items-center tw-justify-end md:tw-justify-start tw-w-full md:tw-w-auto tw-mt-4 md:tw-mt-4">
            <button
              className="btn btn-default btn-primary btn-primary--standard"
              onClick={submit}
            >
              Run
            </button>
            <button
              className="btn btn-default btn-secondary btn-secondary--standard"
              type="button"
              onClick={() => {
                onClose()
              }}
            >
              Close
            </button>
          </div>
        </form>
      </section>
      <div style={{ width: '50%' }}>
        <div
          style={{
            lineHeight: '1.5em',
            fontFamily: 'monospace',
          }}
          className="card card-settings"
        >
          <div>
            // {isEnabled ? '' : 'Add this function, then '} copy the code below
            to use this function in your Netlify function
          </div>
          {usagePreview}
        </div>
        <div
          style={{ maxHeight: '300px', overflow: 'scroll', marginTop: '100px' }}
          className="card card-settings"
        >
          <pre>
            {results
              ? JSON.stringify(results, null, 2)
              : 'Run function to see the results'}
          </pre>
        </div>
      </div>
    </div>
  )
}

const isSubscriptionFunction = (fn: CommunityFunction) => {
  const body = fn.definition

  const parsed = parse(body)
  const operations = parsed.definitions.filter(
    (def) => def.kind === 'OperationDefinition'
  )

  const operation = (operations || [])[0] as OperationDefinitionNode

  if (!operation) {
    return ''
  }

  const isSubscription = operation.operation === 'subscription'

  return isSubscription
}

const CommunityFunction = ({
  communityFunction,
  installedFunctionIds,
  manuallyEnabledServices,
  enableFunction,
  disableFunction,
  schema,
}: {
  communityFunction: CommunityFunction
  installedFunctionIds: Array<string>
  manuallyEnabledServices: Array<string>
  enableFunction: (id: string) => void
  disableFunction: (id: string) => void
  schema: GraphQLSchema
}) => {
  const [showPreview, setShowPreview] = useState(false)

  const isEnabled = installedFunctionIds.includes(communityFunction.id)

  /**
   * Don't show a preview for subscriptions - we need to first figure
   * out long-lived websocket connections to OneGraph through
   * netligraph
   */

  const isSubscription = isSubscriptionFunction(communityFunction)

  return (
    <>
      <div className="inline">
        <div className="media media-figure">
          {communityFunction.services.map((service) => (
            <span
              key={service.service}
              className="plugin__icon-circle"
              style={{ marginRight: '-20px', background: 'none' }}
            >
              <img
                className="plugin__icon plugin__icon-circle"
                style={{ width: '40px', height: '40px' }}
                // @ts-ignore
                src={serviceImageUrl(service.slug)}
              />
            </span>
          ))}
          <div className="plugin__info" style={{ marginLeft: '22px' }}>
            <h2 className="plugin__name h3">{communityFunction.name}</h2>
            <span className="plugin__by">
              by @{communityFunction.id.split('/')[0] || 'unknown'}{' '}
              {isSubscription ? (
                "[Can't try subscription during PoC]"
              ) : (
                <span
                  style={{ color: 'blue', cursor: 'pointer' }}
                  onClick={() => setShowPreview(true)}
                >
                  Try
                </span>
              )}
            </span>
            <div className="plugin__desc">
              <ReactMarkdown>{communityFunction.description}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="actions">
          <button
            className={
              'btn btn-default btn-primary btn-primary--standard ' +
              (isEnabled ? 'btn-primary--danger ' : ' ')
            }
            onClick={() => {
              const id = communityFunction.id
              const missingServices = communityFunction.services.filter(
                (service) =>
                  !manuallyEnabledServices.includes(serviceId(service))
              )

              console.warn(
                'Potentially prompt to install services: ',
                missingServices
              )

              installedFunctionIds.includes(id)
                ? disableFunction(id)
                : enableFunction(id)
            }}
          >
            {installedFunctionIds.includes(communityFunction.id)
              ? 'Remove'
              : 'Add to context'}
          </button>
        </div>
      </div>
      <FunctionPreview
        communityFunction={communityFunction}
        schema={schema}
        onClose={() => setShowPreview(false)}
        isOpen={showPreview}
        isEnabled={isEnabled}
      />
    </>
  )
}

export default function Home() {
  const [token, setToken] = useState('')
  const [auth, setAuth] = useState<OneGraphAuth>(
    makeAuth({
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
      installedFunctionIds: [],
    },
    search: null,
    fullSchema: null,
    communityFunctions: [],
    openServices: [],
    installedFunctionIds: [],
  })

  React.useEffect(() => {
    let fullSchema
    fetchSchemas()
      .then((result) => {
        if (!result.schema) {
          return
        }

        const sdlSchema = buildASTSchema(parse(result.fullSchema))

        fullSchema = sdlSchema

        setState((oldState) => ({ ...oldState, fullSchema: sdlSchema }))

        return fetchCommunityFunctions(fullSchema)
      })
      .then((functions) => {
        setState((oldState) => ({
          ...oldState,
          communityFunctions: functions || [],
        }))
      })
  }, [])

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

  const enableFunction = async (communityFunctionId: string) => {
    const installedFunctionIds = [
      ...(state.database.installedFunctionIds || []),
      communityFunctionId,
    ].filter((v, i, a) => a.indexOf(v) === i)

    const newDatabase: Database = {
      ...state.database,
      installedFunctionIds,
    }
    const serverDatabase = await setIntegrationStatus(newDatabase)
    setState((oldState) => ({ ...oldState, database: serverDatabase }))
  }

  const disableFunction = async (communityFunctionId: string) => {
    const installedFunctionIds = (
      state.database.installedFunctionIds || []
    ).filter((v) => communityFunctionId !== v)

    const newDatabase: Database = {
      ...state.database,
      installedFunctionIds,
    }
    const serverDatabase = await setIntegrationStatus(newDatabase)
    setState((oldState) => ({ ...oldState, database: serverDatabase }))
  }

  const communityFunctionsByService = (service: string) => {
    return state.communityFunctions.filter((fn) =>
      fn.services.map((service) => service.simpleSlug).includes(service)
    )
  }

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

            const communityFunctions = communityFunctionsByService(
              serviceId(service)
            )

            const onToggleFunctions = () => {
              setState((oldState) => {
                const isOpen = oldState.openServices.includes(
                  serviceId(service)
                )

                const openServices = isOpen
                  ? oldState.openServices.filter(
                      (id) => id !== serviceId(service)
                    )
                  : [...oldState.openServices, serviceId(service)]

                return {
                  ...oldState,
                  openServices,
                }
              })
            }

            return (
              <li
                key={serviceId(service)}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', flexGrow: 1 }}>
                  {service.supportsOAuth ? (
                    <OAuthServiceEntry
                      service={service}
                      enabled={enabled}
                      disableIntegration={disableIntegration}
                      enableIntegration={enableIntegration}
                      loggedIn={loggedIn}
                      doLogin={doLogin}
                      doLogout={doLogout}
                      hasFunctions={communityFunctions.length > 0}
                      onToggleFunctions={onToggleFunctions}
                    />
                  ) : (
                    <ServiceEntry
                      service={service}
                      enabled={enabled}
                      disableIntegration={disableIntegration}
                      enableIntegration={enableIntegration}
                      hasFunctions={communityFunctions.length > 0}
                      onToggleFunctions={onToggleFunctions}
                    />
                  )}
                </div>

                {!state.openServices.includes(serviceId(service)) ||
                communityFunctions.length === 0 ? null : (
                  <ul style={{ borderRadius: '6px', backgroundColor: 'white' }}>
                    {!!state.fullSchema
                      ? communityFunctions.map((communityFunction) => {
                          return (
                            <li
                              key={communityFunction.id}
                              className="plugin__row"
                              style={{
                                margin: '16px',
                                borderTop: '2px solid #ddd',
                                padding: '6px',
                                borderRadius: '2px',
                                display: 'unset',
                              }}
                            >
                              <CommunityFunction
                                key={communityFunction.name}
                                communityFunction={communityFunction}
                                installedFunctionIds={
                                  state.database.installedFunctionIds
                                }
                                manuallyEnabledServices={
                                  state.database.manuallyEnabledServices
                                }
                                enableFunction={enableFunction}
                                disableFunction={disableFunction}
                                //@ts-ignore
                                schema={state.fullSchema}
                              />
                            </li>
                          )
                        })
                      : null}
                  </ul>
                )}
              </li>
            )
          })}
      </ul>
    </>
  )
}
