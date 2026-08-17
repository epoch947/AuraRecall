import 'server-only'

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication is required')
    this.name = 'AuthenticationRequiredError'
  }
}

export class AccountUnavailableError extends Error {
  constructor() {
    super('The authenticated account is unavailable')
    this.name = 'AccountUnavailableError'
  }
}

export function authenticationErrorResponse(error: unknown): Response | null {
  if (error instanceof AuthenticationRequiredError) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (error instanceof AccountUnavailableError) {
    return Response.json({ error: 'Account unavailable' }, { status: 403 })
  }
  return null
}
