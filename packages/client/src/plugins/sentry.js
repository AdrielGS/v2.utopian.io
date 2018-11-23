import * as Sentry from '@sentry/browser'

export default ({ app, router, Vue }) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new Sentry.Integrations.Vue({ Vue })]
  })
}
