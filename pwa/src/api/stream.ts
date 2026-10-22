import { getApiBearerToken } from './auth-header'
import { useAuthStore } from '@/features/auth/stores/auth.store'

function resolveAccessToken(explicit?: string): string | null {
  return explicit ?? getApiBearerToken() ?? useAuthStore.getState().accessToken
}

function apiUrl(path: string, params?: Record<string, string | undefined>) {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) if (value) query.set(key, value)
  return `${base}${path}${query.size ? `?${query.toString()}` : ''}`
}

export async function _getNdjson<T>(
  path: string,
  params?: Record<string, string | undefined>,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<T[]> {
  const token = resolveAccessToken(accessToken)
  if (!token) throw new Error('Reference download failed (401).')

  const response = await fetch(apiUrl(path, params), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  if (!response.ok) throw new Error(`Reference download failed (${response.status}).`)

  const items: T[] = []
  const reader = response.body?.getReader()
  if (!reader) {
    for (const line of (await response.text()).split('\n')) if (line.trim()) items.push(JSON.parse(line) as T)
    return items
  }

  const decoder = new TextDecoder()
  let remainder = ''
  for (;;) {
    const { done, value } = await reader.read()
    remainder += decoder.decode(value, { stream: !done })
    const lines = remainder.split('\n')
    remainder = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) items.push(JSON.parse(line) as T)
    if (done) break
  }
  if (remainder.trim()) items.push(JSON.parse(remainder) as T)
  return items
}

export async function _putExternal(url: string, body: Blob, contentType: string, signal?: AbortSignal) {
  const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body, signal })
  if (!response.ok) throw new Error(`File upload failed (${response.status}).`)
}
