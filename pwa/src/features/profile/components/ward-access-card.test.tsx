import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WardAccessCard } from './ward-access-card'

const wards = [
  { id: 'one', name: 'Tudun Wada', lga: 'Jos North' },
  { id: 'two', name: 'Gangare', lga: 'Jos North' },
]

describe('WardAccessCard', () => {
  it('explains unrestricted access when no wards are assigned', () => {
    render(<WardAccessCard wards={[]} />)
    expect(screen.getByText('All wards')).toBeInTheDocument()
    expect(screen.getByText(/any available ward/i)).toBeInTheDocument()
  })

  it('shows one assigned ward directly', () => {
    render(<WardAccessCard wards={[wards[0]]} />)
    expect(screen.getByText('Tudun Wada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /view wards/i })).not.toBeInTheDocument()
  })

  it('expands and hides multiple assigned wards', () => {
    render(<WardAccessCard wards={wards} />)
    const button = screen.getByRole('button', { name: /view wards/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Gangare')).not.toBeInTheDocument()
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /hide wards/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Gangare')).toBeInTheDocument()
  })
})
