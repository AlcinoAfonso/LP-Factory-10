import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  INVALID_CREDENTIALS_MESSAGE,
  OPERATIONAL_FAILURE_MESSAGE,
  classifyLoginFailure,
} from './loginError'

const providerCredentialMessage = 'Invalid login credentials'
const invalidCredentials = classifyLoginFailure({
  code: 'invalid_credentials',
  message: providerCredentialMessage,
  status: 400,
})

assert.equal(invalidCredentials.publicMessage, INVALID_CREDENTIALS_MESSAGE)
assert.deepEqual(invalidCredentials.diagnostic, {
  category: 'invalid_credentials',
  status: 400,
})
assert.doesNotMatch(invalidCredentials.publicMessage, /Invalid login credentials/)

const providerOperationalMessage = 'Failed to fetch'
const operationalFailure = classifyLoginFailure({
  code: 'request_timeout',
  message: providerOperationalMessage,
  status: 503,
})

assert.equal(operationalFailure.publicMessage, OPERATIONAL_FAILURE_MESSAGE)
assert.deepEqual(operationalFailure.diagnostic, {
  category: 'operational_failure',
  status: 503,
})
assert.doesNotMatch(operationalFailure.publicMessage, /Failed to fetch/)

assert.deepEqual(classifyLoginFailure(new Error('raw provider error')), {
  publicMessage: OPERATIONAL_FAILURE_MESSAGE,
  diagnostic: { category: 'operational_failure' },
})

const loginForm = readFileSync(
  new URL('../../components/login-form.tsx', import.meta.url),
  'utf8',
)

assert.match(loginForm, /signInWithPassword/)
assert.match(loginForm, /window\.location\.assign\(safeNext\)/)
assert.match(loginForm, /href="\/auth\/forgot-password"/)
assert.match(loginForm, />\s*Esqueci minha senha\s*</)
assert.match(loginForm, /classifyLoginFailure\(error\)/)
assert.doesNotMatch(loginForm, /error instanceof Error \? error\.message/)

console.log('Auth login validation cases passed.')
