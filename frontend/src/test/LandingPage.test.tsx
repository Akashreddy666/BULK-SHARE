import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'
import { DemoBanner } from '@/components/layout/DemoBanner'

function renderLanding() {
  render(<LandingPage onOpenAuth={vi.fn()} onOpenDemoSwitcher={vi.fn()} />)
}

describe('Landing page', () => {
  it('renders the public demonstration notice', () => {
    render(<DemoBanner />)
    expect(screen.getByText(/Public demo mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Sample grocery data & simulated transactions only/i)).toBeInTheDocument()
  })

  it('explains the group-buying flow and household privacy', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1, name: /Better grocery prices, together/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Calculate your household savings/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Sealed packs only/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Private household lists/i })).toBeInTheDocument()
  })

  it('recalculates the household total at the selected tier and handles ineligible quantities', () => {
    renderLanding()
    const calculator = within(screen.getByRole('region', { name: /Calculate your household savings/i }))
    expect(calculator.getByText('₹158.4')).toBeInTheDocument()
    fireEvent.click(calculator.getByRole('button', { name: /Add one household pack/i }))
    expect(calculator.getByText('₹237.6')).toBeInTheDocument()

    fireEvent.change(calculator.getByRole('slider'), { target: { value: '4' } })
    expect(calculator.getByText('Below minimum')).toBeInTheDocument()
    fireEvent.change(calculator.getByRole('slider'), { target: { value: '5' } })
    expect(calculator.getByText('₹162')).toBeInTheDocument()
  })
})
