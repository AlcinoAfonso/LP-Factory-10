export const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.'
export const OPERATIONAL_FAILURE_MESSAGE =
  'Não foi possível entrar agora. Tente novamente em instantes.'

export type LoginFailure = Readonly<{
  publicMessage: string
  diagnostic: Readonly<{
    category: 'invalid_credentials' | 'operational_failure'
    status?: number
  }>
}>

type AuthErrorLike = Readonly<{
  code?: unknown
  status?: unknown
}>

function readAuthError(error: unknown): AuthErrorLike | null {
  if (typeof error !== 'object' || error === null) return null
  return error as AuthErrorLike
}

export function classifyLoginFailure(error: unknown): LoginFailure {
  const authError = readAuthError(error)
  const invalidCredentials = authError?.code === 'invalid_credentials'
  const status =
    typeof authError?.status === 'number' && Number.isInteger(authError.status)
      ? authError.status
      : undefined

  return {
    publicMessage: invalidCredentials
      ? INVALID_CREDENTIALS_MESSAGE
      : OPERATIONAL_FAILURE_MESSAGE,
    diagnostic: {
      category: invalidCredentials ? 'invalid_credentials' : 'operational_failure',
      ...(status === undefined ? {} : { status }),
    },
  }
}
