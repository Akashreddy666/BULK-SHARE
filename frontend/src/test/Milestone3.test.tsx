import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DemandSummaryPanel } from '@/components/aggregation/DemandSummaryPanel'
import { QuotationCard } from '@/components/quotation/QuotationCard'
import { QuotationComparisonView } from '@/components/quotation/QuotationComparisonView'
import { DemandSummaryResponse, SupplierQuotation } from '@/types'

const mockSummary: DemandSummaryResponse = {
  group_id: 'test-group-01',
  group_name: 'Indiranagar Essentials Group #1',
  total_variants: 2,
  total_packs: 12,
  total_retail_value: 3600.0,
  estimated_wholesale_value: 2880.0,
  estimated_savings: 720.0,
  savings_percentage: 20.0,
  items: [
    {
      variant_id: 'var-rice-01',
      product_name: 'Sona Masoori Rice',
      category: 'RICE',
      brand: 'India Gate Premium',
      pack_quantity: 5,
      pack_unit: 'kg',
      variant_display_name: 'India Gate Premium (5 kg)',
      reference_retail_price: 360.0,
      total_packs: 6,
      total_quantity_units: 30,
      total_retail_value: 2160.0,
      best_wholesale_price: 295.0,
      estimated_wholesale_cost: 1770.0,
      estimated_savings: 390.0,
      savings_percentage: 18.1,
      qualified_tier: {
        id: 'tier-01',
        variant_id: 'var-rice-01',
        min_quantity: 5,
        price_per_pack: 295.0,
        tier_label: 'Tier 1 (5+ packs)',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      next_tier: {
        id: 'tier-02',
        variant_id: 'var-rice-01',
        min_quantity: 15,
        price_per_pack: 270.0,
        tier_label: 'Tier 2 (15+ packs)',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      packs_to_next_tier: 9,
    },
  ],
}

const mockQuotation: SupplierQuotation = {
  id: 'quote-01',
  demand_snapshot_id: 'snap-01',
  supplier_id: 'supp-01',
  supplier_name: 'Kisan Wholesale Agro Supplies',
  status: 'SUBMITTED',
  total_quoted_price: 2750.0,
  total_retail_value: 3600.0,
  savings_amount: 850.0,
  savings_percentage: 23.6,
  valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
  notes: 'APMC certified stock with test certificates.',
  items: [
    {
      id: 'qi-01',
      quotation_id: 'quote-01',
      variant_id: 'var-rice-01',
      quoted_packs: 6,
      quoted_price_per_pack: 290.0,
      line_total: 1740.0,
      variant_display_name: 'India Gate Premium (5 kg)',
      reference_retail_price: 360.0,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('Milestone 3 Frontend Components', () => {
  it('renders DemandSummaryPanel with pooled packs and privacy badge', () => {
    render(
      <DemandSummaryPanel
        groupId="test-group-01"
        summary={mockSummary}
        isLoading={false}
        isOrganizer={true}
      />
    )

    expect(screen.getByText(/Household Privacy Protected/i)).toBeInTheDocument()
    expect(screen.getByText('12 packs')).toBeInTheDocument()
    expect(screen.getByText(/Tier 1 \(5\+ packs\) Unlocked/i)).toBeInTheDocument()
    expect(screen.getByText(/Lock Demand & Request Quotes/i)).toBeInTheDocument()
  })

  it('renders QuotationCard with supplier details and toggles line items', () => {
    render(<QuotationCard quotation={mockQuotation} isLowestPrice={true} isOrganizer={true} />)

    expect(screen.getByText('Kisan Wholesale Agro Supplies')).toBeInTheDocument()
    expect(screen.getByText(/Lowest quoted price/i)).toBeInTheDocument()
    expect(screen.getByText('₹850')).toBeInTheDocument()

    // Line items toggle
    const toggleBtn = screen.getByText(/View 1 Line Items/i)
    fireEvent.click(toggleBtn)

    expect(screen.getByText('Hide Line Items ▲')).toBeInTheDocument()
    expect(screen.getByText('India Gate Premium (5 kg)')).toBeInTheDocument()
  })

  it('renders QuotationComparisonView comparing multiple wholesale bids', () => {
    const quote2: SupplierQuotation = {
      ...mockQuotation,
      id: 'quote-02',
      supplier_name: 'Bengaluru APMC Traders',
      total_quoted_price: 2900.0,
      savings_amount: 700.0,
      savings_percentage: 19.4,
    }

    render(
      <QuotationComparisonView
        quotations={[mockQuotation, quote2]}
        isLoading={false}
        isOrganizer={true}
      />
    )

    expect(screen.getByText(/2 supplier quotations/i)).toBeInTheDocument()
    expect(screen.getByText('Kisan Wholesale Agro Supplies')).toBeInTheDocument()
    expect(screen.getByText('Bengaluru APMC Traders')).toBeInTheDocument()
  })
})
