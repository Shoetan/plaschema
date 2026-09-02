import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/stores/auth.store'

import { _getNdjson, _putExternal } from './stream'

describe('stream transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ accessToken: 'access-token' })
  })

  it('parses NDJSON split across response chunks and sends API authorization', async () => {
    const encoder = new TextEncoder()
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"id":"one"}\n{"id"'))
        controller.enqueue(encoder.encode(':"two"}\n'))
        controller.close()
      },
    }))
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)

    await expect(_getNdjson<{ id: string }>('/wards/stream')).resolves.toEqual([{ id: 'one' }, { id: 'two' }])
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/wards/stream'), expect.objectContaining({ headers: { Authorization: 'Bearer access-token' } }))
  })

  it('uploads a presigned file without leaking the API bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))
    await _putExternal('https://storage.example/upload', new Blob(['photo']), 'image/jpeg')
    expect(fetchMock).toHaveBeenCalledWith('https://storage.example/upload', expect.objectContaining({
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
    }))
  })
})
