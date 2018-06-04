// imports.
import store from 'src/store'

// runs before each route change.
const beforeEach = async (to, from, next) => {
  // dispatch derivation key and user check.
  const initializers = store.dispatch('prepareEncryption')
    .then(() => store.dispatch('auth/loadUser'))
    .catch(() => {})

  // finish the initialization calling next().
  return initializers.finally(() => next())
}

// default export.
export default beforeEach
