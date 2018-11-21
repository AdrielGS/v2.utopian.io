const withPrefix = (prefix, routes) =>
  routes.map((route) => {
    route.path = prefix + route.path
    return route
  })

const routes = [
  {
    // failsafe
    path: '/',
    redirect: '/en'
  },
  {
    path: '/:locale',
    name: 'home'
  },
  ...withPrefix('/:locale', [
    {
      path: '/login',
      name: 'login',
      component: () => import('src/pages/login')
    },
    {
      path: '/signup/utopian/',
      name: 'signup.utopian',
      component: () => import('src/pages/signup/utopian')
    },
    {
      path: '/steem/connect/',
      name: 'signup.connect',
      component: () => import('src/pages/steem/connect')
    },
    { // Always leave this as last one
      path: '/*',
      name: 'not-found',
      component: () => import('src/pages/404')
    }
  ])
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '/:locale/*',
    component: () => import('src/pages/404')
  })
}

export default routes
