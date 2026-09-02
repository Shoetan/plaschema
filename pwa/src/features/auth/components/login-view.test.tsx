import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { LoginView } from '@/features/auth/components/login-view'
import { useAuthStore } from '@/features/auth/stores/auth.store'

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><LoginView /></MemoryRouter></QueryClientProvider>)
}

describe('LoginView', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ accessToken: null, expiresAt: null, user: null, status: 'unauthenticated', validation: null, notice: null })
  })

  it('requires both fields', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus()
  })
})
