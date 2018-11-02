// add Meta
import { Quasar, Cookies } from 'quasar'
import VueI18n from 'vue-i18n'
import localesList from 'src/i18n/localesList.json'

/* Manage the locale
 * - GDPR check
 * - Cookie check
 * - Browser pref check
 * - Route check
 * - Write meta tag for locale
 *
 *  GENERAL RULE: Functions have internal guards.
 *  Never trust someone else to "got your back!"
 *
 */

/* Set GDPR cookie
 *
 * @property {object} ssrContext - required for isomorphism
 * @returns {string} timestamp
 *
 * note for @Cehraphaim: GDPR should be externalized into another global mixin
 * with its own beforeEach!
 *
 */
export const setGDPR = (cookies) => {
  const now = Date.now()
  cookies.set('GDPR', now, { path: '/' })
  return now
}

/* Get GDPR cookie
 *
 * @property {object} ssrContext - required for isomorphism
 * @returns {string} GDPR timestamp
 *
 */
export const getGDPR = ssrContext => {
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
  const GDPR = cookies.get('GDPR')
  if (!GDPR) {
    // delete all cookies!!!
    return undefined
  } else {
    return cookies.get('GDPR')
  }
}

/* Get and set the locale cookie
 *
 * @property {object} ssrContext - required for isomorphism
 * @returns {string} Language from cookie or undefined
 *
 */
export const getLocaleCookie = ssrContext => {
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
  const cookie = cookies.get('locale')
  if (cookie) {
    // guard to make sure the cookie IS a real value
    if (localesList.includes(cookie)) {
      return cookie.toLowerCase()
    }
  } else {
    return undefined
  }
}

/* Get browser locale
 *
 * @property {object} ssrContext - required for isomorphism
 * @returns {string} Language from cookie or undefined
 *
 */
/*
export const getBrowserLocale = (ssrContext) => {
  if (ssrContext) {
    const languages = ssrContext.req.headers['accept-language']
    if (languages) {
      // common languages string: en-GB,en;q=0.9,en-US;q=0.8,de;q=0.7
      let browserAcceptLocale = languages.split(',')
      let browserMatch
      // browserAcceptLocale.some(browserLocale => {
      for (let browserLocale of browserAcceptLocale) {
        browserMatch = browserLocale.split(';')[0].toLowerCase()
        if (localesList.includes(browserMatch)) break
      }
      return browserMatch
    } else {
      return undefined
    }
  }
}
*/
export const getBrowserLocale = ssrContext => {
  // native Quasar version
  if (ssrContext) {
    const language = Quasar.i18n.getLocale()
    if (language) {
      for (let locales of localesList) {
        if (locales.startsWith(language.split('-')[0])) {
          return locales
        }
      }
    } else {
      return undefined
    }
  }
}

/* Detect that route locale param is a member of the set of locales
 *
 * @property {object} routeLocale - :locale param to check
 * @returns {string}  lower-cased locale
 *
 */
export const getRoute = routeLocale => {
  // this guard makes sure only valid langs are served
  const validRoute = localesList.includes(routeLocale)
  if (validRoute) {
    return routeLocale
  }
  // fallback to
  return 'en-us'
}

/* Replace locale in route
 *
 * @property {object} route - just the slashed route after the main URL
 * @property {object} locale - as determined by replaceLocal
 * @returns {string} new route
 *
 */
export const replaceLocale = (route, locale) => {
  route = route.split('/')
  route[1] = locale
  return route.join('/')
}

/* Waterfall for Locale Discovery
 *
 * @property {object} ssrContext - required for isomorphism
 * @property {object} router - object for route detection
 * @returns {string} Decision tree result
 *
 * FLOW:
 *  0. check if GDPR is set
 *  1. check if there's a cookie
 *  2. if not, look for browser pref
 *  3. otherwise revert to route
 *
 */
export const getLocale = (ssrContext, routeLocale) => {
  const GDPR = getGDPR(ssrContext)
  if (GDPR) {
    const cookie = getLocaleCookie(ssrContext)
    if (typeof cookie !== 'undefined') {
      return cookie
    }
  }
  const browserLocale = getBrowserLocale(ssrContext)
  if (typeof browserLocale !== 'undefined') {
    return browserLocale
  }
  // in the end return undefined and let router handle it.
  return getRoute(routeLocale)
}

export default ({ app, Vue, ssrContext, router }) => {
  Vue.use(VueI18n)

  app.i18n = new VueI18n({
    silentTranslationWarn: true,
    // fallbackLocale: 'en-us',
    messages: {}
  })
  app.loadedLanguages = []

  router.beforeEach((to, from, next) => {
    const routeLocale = to.params.locale
    const locale = getLocale(ssrContext, routeLocale)

    if (routeLocale !== locale) {
      next({
        path: replaceLocale(to.path, locale)
      })
    }

    // on first load this will always be true
    if (!app.loadedLanguages.includes(locale)) {
      app.loadedLanguages.push(locale)
      app.i18n.setLocaleMessage(locale, require(`src/i18n/locales/${locale}.json`))
      import(`quasar-framework/i18n/${locale}`)
        .then((lang) => {
          Quasar.i18n.set(lang.default)
        })
    } else {
      import(`quasar-framework/i18n/${locale}`)
        .then((lang) => {
          Quasar.i18n.set(lang.default)
        })
    }
    app.i18n.locale = locale
    next()
  })

  Vue.mixin({
    /**
     * Vue global object available everywhere
     * @namespace
     * @property {string}  locale              - The active language
     */
    async preFetch ({ store, currentRoute, redirect, ssrContext }) {
      if (ssrContext) {
        const locale = currentRoute.params.locale
        if (localesList.includes(locale)) {
          return import(`quasar-framework/i18n/${locale}`)
            .then((lang) => {
              Quasar.i18n.lang = locale
              Quasar.i18n.set(lang.default)
            })
        }
      }
    },
    beforeMount () {
      const { asyncData } = this.$options
      if (asyncData) {
        this.locale = asyncData({
          locale: this.$route.params.locale
        })
      }
    },
    mounted () {
      // watch the emit event for localeChange
      this.$root.$on('localeChange', (val) => {
        this.locale = val
      })
    },
    watch: {
      locale: {
        handler (val, oldVal) {
          // todo: check the new route before we reroute
          let route = this.$route.path.split('/')
          route[1] = val
          route = route.join('/')
          if (this.$q.cookies.get('GDPR')) {
            this.$q.cookies.set('locale', val, { path: '/' })
          }
          this.$router.push(route)
        }
      },
      immediate: true
    }
  })
}

/* 
 * DO NOT EDIT THIS FILE! It has been auto-generated.
 * It will be overwritten on the next update of the package.
 * 
 * Constructed by @utopian/i18n v1.0.0
 *
 */
