import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginView } from '@/features/auth/components/login-view'
import { useAppStore } from '@/stores/app-store'

describe('LoginView', () => {
  beforeEach(() => {
    useAppStore.setState({ user: null })
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  it('requires both fields', async () => {
    render(<MemoryRouter><LoginView /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email and password.')
  })
})
