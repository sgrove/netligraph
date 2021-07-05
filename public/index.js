import React from 'react'
import ReactDOM from 'react-dom'
import Home from './pages/home/index'
import GraphiQL from './pages/graphiql/index'
import { useState } from 'react'
import { makeAuth } from './frontendHelpers'

// @ts-ignore: dev demo
window.demoAuth = makeAuth({
  appId: process.env.ONEGRAPH_APP_ID,
})

// @ts-ignore: dev demo
window.demoAuthReload = () => {
  // @ts-ignore: dev demo
  window.demoAuth = makeAuth({
    appId: process.env.ONEGRAPH_APP_ID,
  })
}

function App() {
  const [state, setState] = useState(() => {
    return {
      view: 'graphiql',
      fullSchema: null,
    }
  })

  return (
    <div>
      <main className="splash-screen">
        <div
          className="
        tw-z-overlay
        tw-fixed
        tw-inset-0
        tw-items-center
        tw-flex
        tw-justify-center
        tw-m-0
        tw-min-h-screen
        tw-bg-black
      "
        >
          <div className="container">
            <svg
              aria-hidden="true"
              width={50}
              height={50}
              className="rotate-loop"
            >
              <use xlinkHref="#logo" />
            </svg>
            <p className="visuallyhidden">Loading Netlify dashboard</p>
          </div>
        </div>
      </main>
      <div id="root" tabIndex={-1}>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="visuallyhidden"
        />
        <div className="app">
          <header className="app-header inverse" role="banner">
            <a href="#main" className="skip-to-main">
              Skip to main content
            </a>
            <div className="container">
              <div className="navbar">
                <ol
                  className="
                nav
                tw-flex-col tw-items-start tw-text-xl
                md:tw-flex-row md:tw-items-center
              "
                  aria-label="Breadcrumb"
                >
                  <li>
                    <a
                      className="
                    btn btn-default btn-tertiary btn-tertiary--standard
                    logo
                    tw-text-xl
                    tw-font-semibold
                    tw-leading-3
                    tw-w-auto
                    tw-min-h-[40px]
                    tw-text-left
                    tw-text-white
                    hover:tw-bg-transparent
                    !tw-p-0
                  "
                      title="Home"
                      href="/"
                    >
                      <svg aria-hidden="true" width={40} height={40}>
                        <use xlinkHref="#logo" />
                      </svg>
                      <span className="wordmark visuallyhidden">Netlify</span>
                    </a>
                  </li>
                  <li>
                    <div
                      className="dropdown"
                      aria-expanded="false"
                      aria-haspopup="listbox"
                    >
                      <button
                        role="button"
                        aria-label="Sean Grove's team. Open menu"
                        aria-haspopup="true"
                        data-toggle="true"
                        name="Sean Grove's team"
                        className="
                      btn btn-default btn-secondary btn-secondary--standard
                      tw-text-xl
                      tw-font-semibold
                      tw-leading-3
                      tw-w-auto
                      tw-p-1
                      tw-min-h-[40px]
                      tw-text-left
                      tw-text-white
                      hover:tw-text-white hover:tw-bg-gray-darkest
                      focus:tw-bg-gray-darkest
                      dark:hover:tw-bg-gray-darkest
                      dark:focus:tw-bg-gray-darkest
                      tw-bg-transparent
                      dark:tw-bg-transparent
                    "
                        type="button"
                      >
                        Sean Grove's team
                        <svg
                          height={12}
                          viewBox="0 0 16 16"
                          width={12}
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                          className="
                        tw-transition-transform
                        tw-duration-100
                        tw-ease-cubic-bezier
                        tw-align-middle
                        tw-inline-block
                        tw--mt-[2px]
                        tw-ml-1
                      "
                        >
                          <path d="M4 4l3.4 3.4c.3.4.9.4 1.2 0L11.9 4 14 6.2l-5.4 5.6c-.3.3-.9.3-1.2 0L2 6.2z" />
                        </svg>
                      </button>
                      <ul className="dropdown-inner dropdown-menu">
                        <li>
                          <a
                            id="account-dropdown-item-0"
                            role="option"
                            aria-selected="false"
                            className="menuitem"
                          >
                            OneGraph-Netlify [DEV]
                          </a>
                        </li>
                        <li>
                          <a
                            id="account-dropdown-item-1"
                            role="option"
                            aria-selected="false"
                            className="menuitem selected"
                          >
                            Sean Grove's team
                            <svg
                              viewBox="0 0 16 16"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-label="selected"
                              className="checkmark"
                            >
                              <path d="M6.054 8.958L3.65 6.555A2.112 2.112 0 10.663 9.543l3.86 3.86a2.112 2.112 0 002.054.543c.38-.084.74-.274 1.033-.568l7.77-7.77a2.114 2.114 0 00-2.987-2.99l-6.34 6.34z"></path>
                            </svg>
                          </a>
                        </li>
                        <li>
                          <a
                            id="account-dropdown-item-2"
                            role="option"
                            aria-selected="false"
                            className="menuitem divider"
                          >
                            Create new team
                          </a>
                        </li>
                      </ul>
                    </div>
                  </li>
                </ol>
                <div className="nav Nav--utilities tw-pr-[2px]">
                  <div
                    className="
                  md:tw-mx-1 md:tw-relative
                  tw-mx-[4px] tw-static tw-w-button-icon
                  pull-right
                "
                    role="combobox"
                    aria-expanded="false"
                    aria-haspopup="listbox"
                    aria-labelledby="downshift-3-label"
                  >
                    <button
                      role="button"
                      aria-label="Notifications. Open menu"
                      aria-haspopup="true"
                      data-toggle="true"
                      className="
                    btn btn-icon btn-tertiary btn-tertiary--standard
                    hover:tw-text-white hover:tw-bg-gray-darkest
                    focus:tw-text-white focus:tw-bg-gray-darkest
                    active:tw-text-white active:tw-bg-gray-darkest
                    dark:hover:tw-text-white dark:active:tw-text-white
                    tw-text-gray-dark tw-bg-transparent
                    dark:tw-text-gray-light
                  "
                      type="button"
                    >
                      <span
                        className="
                      tw-top-1/2
                      tw-left-1/2
                      tw-transform
                      tw--translate-x-1/2
                      tw--translate-y-1/2
                    "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          role="img"
                        >
                          <g fill="none">
                            <g>
                              <path
                                fill="currentColor"
                                d="M12.338 2.01a6 6 0 005.274 7.977V10l2.141 4.008c.513.959.201 2.18-.696 2.728a1.778 1.778 0 01-.928.264H5.871C4.837 17 4 16.105 4 15c0-.348.085-.69.246-.992L6.388 10V8C6.388 4.686 8.9 2 12 2c.113 0 .226.004.338.01zM15 19a3 3 0 11-6 0h6z"
                              ></path>
                              <circle cx={18} cy="4.25" r={4} fill="#FA3946" />
                            </g>
                          </g>
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div
                    className="
                  md:tw-mx-1 md:tw-relative
                  tw-mx-[4px] tw-static tw-w-button-icon
                "
                    role="combobox"
                    aria-expanded="false"
                    aria-haspopup="listbox"
                    aria-labelledby="downshift-4-label"
                  >
                    <button
                      role="button"
                      aria-label="Support. Open menu"
                      aria-haspopup="true"
                      data-toggle="true"
                      className="
                    btn btn-icon btn-tertiary btn-tertiary--standard
                    hover:tw-text-white hover:tw-bg-gray-darkest
                    active:tw-text-white active:tw-bg-gray-darkest
                    dark:hover:tw-text-white dark:active:tw-text-white
                    tw-text-gray-dark tw-bg-transparent
                    dark:tw-text-gray-light
                  "
                      type="button"
                    >
                      <span
                        className="
                      tw-top-1/2
                      tw-left-1/2
                      tw-transform
                      tw--translate-x-1/2
                      tw--translate-y-1/2
                    "
                      >
                        <svg
                          fill="none"
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                          role="img"
                          width={24}
                          height={24}
                        >
                          <path
                            clipRule="evenodd"
                            d="M15 8A7 7 0 101 8a7 7 0 0014 0zM4 8a4 4 0 118 0 4 4 0 01-8 0z"
                            fill="#7d8589"
                            fillRule="evenodd"
                          />
                          <path
                            d="M13.77 11.97L11.58 9.8c-.23.45-.54.86-.92 1.2l2.12 2.12c.37-.34.7-.72.99-1.14zM3.22 13.11L5.34 11c-.38-.34-.7-.75-.92-1.2l-2.18 2.18c.28.42.61.8.98 1.14zm2.41-8.33c-.4.3-.75.67-1.02 1.1L2.46 3.72c.3-.4.65-.76 1.04-1.08zm5.81 1.17c-.26-.43-.6-.81-1-1.12l2.13-2.13c.38.33.72.7 1.03 1.1z"
                            fill="#2d3b41"
                          />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div
                    className="dropdown pull-right tw-w-[36px] tw-h-[36px]"
                    aria-expanded="false"
                    aria-haspopup="listbox"
                  >
                    <button
                      role="button"
                      aria-label="User. Open menu"
                      aria-haspopup="true"
                      data-toggle="true"
                      name="User"
                      className="
                    btn btn-default btn-tertiary btn-tertiary--standard
                    tw-rounded-50 tw-w-[36px] tw-h-[36px]
                    hover:tw-shadow-teal
                    tw-relative
                  "
                      type="button"
                    >
                      <img
                        className="
                      tw-rounded-50
                      tw-inline-block
                      tw-text-xl
                      tw-text-center
                      tw-self-center
                      tw-object-cover
                      tw-h-avatar-md
                      tw-w-avatar-md
                      tw-leading-normal
                      tw-border-gray-darkest
                      tw-border-solid
                      tw-border
                      tw-absolute
                      tw-m-0
                      tw-top-0
                      tw-left-0
                    "
                        src="https://avatars2.githubusercontent.com/u/35296?s=32"
                        width={32}
                        height={32}
                        alt=""
                      />
                    </button>
                    <ul className="dropdown-inner dropdown-menu">
                      <li>
                        <a
                          id="downshift-5-item-0"
                          role="option"
                          aria-selected="false"
                          className="menuitem"
                        >
                          <div>
                            <strong className="h4">
                              Sean Grove
                              <br />
                            </strong>
                            <small className="subdued">sean@bushi.do</small>
                          </div>
                        </a>
                      </li>
                      <li>
                        <a
                          id="downshift-5-item-1"
                          role="option"
                          aria-selected="false"
                          className="menuitem"
                        >
                          User settings
                        </a>
                      </li>
                      <li>
                        <a
                          id="downshift-5-item-2"
                          role="option"
                          aria-selected="false"
                          className="menuitem"
                        >
                          Netlify Labs
                        </a>
                      </li>
                      <li>
                        <a
                          id="downshift-5-item-3"
                          role="option"
                          aria-selected="false"
                          className="menuitem"
                        >
                          Sign out
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="navigation">
                <div className="navbar">
                  <nav aria-label="Secondary navigation">
                    <ul className="nav">
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/overview"
                        >
                          Team overview
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/sites"
                        >
                          Sites
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/builds/"
                        >
                          Builds
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/plugins"
                        >
                          Plugins
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                      btn btn-default btn-tertiary btn-tertiary--standard
                      tw-w-auto
                      tw-font-semibold
                      tw-p-1
                      tw-min-h-[40px]
                      tw-leading-3
                      tw-text-gray-dark
                      dark:tw-text-gray-light
                      hover:tw-text-white hover:tw-bg-gray-darkest
                      focus:tw-text-white focus:tw-bg-gray-darkest
                    "
                          href="/teams/sgrove/dns"
                        >
                          Domains
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/members"
                        >
                          Members
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/log"
                        >
                          Audit log
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/billing"
                        >
                          Billing
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                      btn btn-default btn-tertiary btn-tertiary--standard
                      tw-w-auto
                      tw-font-semibold
                      tw-p-1
                      tw-min-h-[40px]
                      tw-leading-3
                      tw-text-gray-dark
                      dark:tw-text-gray-light
                      hover:tw-text-white hover:tw-bg-gray-darkest
                      focus:tw-text-white focus:tw-bg-gray-darkest
                      !tw-text-white
                    "
                          href="/teams/sgrove/integrations"
                        >
                          Integrations
                        </a>
                      </li>
                      <li>
                        <a
                          className="
                        btn btn-default btn-tertiary btn-tertiary--standard
                        tw-w-auto
                        tw-font-semibold
                        tw-p-1
                        tw-min-h-[40px]
                        tw-leading-3
                        tw-text-gray-dark
                        dark:tw-text-gray-light
                        hover:tw-text-white hover:tw-bg-gray-darkest
                        focus:tw-text-white focus:tw-bg-gray-darkest
                      "
                          href="/teams/sgrove/settings"
                        >
                          Team settings
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </header>
          <main id="main" className="app-main" role="main" tabIndex={-1}>
            <section className="container">
              <div className="card table">
                <header className="table-header">
                  <h1 className="card-title">Integrations</h1>
                  <div className="toolbar">
                    <button
                      className="btn btn-default btn-primary btn-primary--standard"
                      type="button"
                      onClick={() => {
                        if (state.view === 'catalog') {
                          return setState((oldState) => ({
                            ...oldState,
                            view: 'graphiql',
                          }))
                        }

                        return setState((oldState) => ({
                          ...oldState,
                          view: 'catalog',
                        }))
                      }}
                    >
                      {state.view === 'catalog'
                        ? 'Explore your APIs'
                        : 'Add a new service integrations'}{' '}
                    </button>
                  </div>
                </header>
                <section>
                  {state.view === 'catalog' ? <Home /> : <GraphiQL />}
                </section>
              </div>
            </section>
          </main>
          <footer className="app-footer inverse" role="contentinfo">
            <div className="container">
              <nav className="navbar">
                <ul className="nav" aria-label="External links">
                  <li>
                    <a href="https://www.netlify.com/docs/">Docs</a>
                  </li>
                  <li>
                    <a href="https://www.netlify.com/pricing/">Pricing</a>
                  </li>
                  <li>
                    <a href="https://www.netlify.com/support">Support</a>
                  </li>
                  <li>
                    <a href="https://www.netlify.com/news/">News</a>
                  </li>
                  <li>
                    <a href="https://www.netlify.com/tos/">Terms</a>
                  </li>
                </ul>
              </nav>
              <p>
                <small>© 2021 Netlify</small>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#app-root'))
