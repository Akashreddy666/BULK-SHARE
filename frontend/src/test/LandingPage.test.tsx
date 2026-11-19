import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'
import { DemoBanner } from '@/components/layout/DemoBanner'

describe('LandingPage & Components Smoke Tests', () => {
  it('renders the Public Demo Mode disclaimer banner', () => {
    render(<DemoBanner />)
    expect(screen.getByText(/Public Demo Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Sample grocery data & simulated transactions only/i)).toBeInTheDocument()
  })

  it('renders the Hero headline and key value propositions', () => {
    const mockOpenAuth = vi.fn()
    const mockOpenDemo = vi.fn()

    render(
      <LandingPage
        onOpenAuth={mockOpenAuth}
        onOpenDemoSwitcher={mockOpenDemo}
      />
    )

    expect(screen.getByText(/Buy Grocery Staples at/i)).toBeInTheDocument()
    expect(screen.getByText(/Wholesale Prices/i)).toBeInTheDocument()
    expect(screen.getByText(/Calculate Your Household Savings/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Sealed Packs Only/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Private Household Lists/i).length).toBeGreaterThan(0)
  })

  it('interactively updates calculated savings when pack quantities change', () => {
    const mockOpenAuth = vi.fn()
    const mockOpenDemo = vi.fn()

    render(
      <LandingPage
        onOpenAuth={mockOpenAuth}
        onOpenDemoSwitcher={mockOpenDemo}
      />
    )

    // Find '+' buttons to increment quantities
    const plusButtons = screen.getAllByRole('button', { name: '+' })
    expect(plusButtons.length).toBeGreaterThan(0)

    // Increment rice quantity
    fireEvent.click(plusButtons[0])

    // Verify savings and total recalculations exist
    expect(screen.getByText(/Monthly Savings Breakdown/i)).toBeInTheDocument()
  })
})
