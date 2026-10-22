/** In-memory bearer mirror updated synchronously in the auth store (avoids post-login request races). */
let bearerToken: string | null = null

export function setApiBearerToken(token: string | null) {
  bearerToken = token
}

export function getApiBearerToken(): string | null {
  return bearerToken
}
