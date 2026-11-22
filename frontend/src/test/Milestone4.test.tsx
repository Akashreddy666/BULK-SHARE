import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationRoundPanel } from '@/components/confirmation/ConfirmationRoundPanel'
import { MemberConfirmationModal } from '@/components/confirmation/MemberConfirmationModal'
import { LockedOrderCard } from '@/components/order/LockedOrderCard'
import { ConfirmationRound, GroupOrder, MemberConfirmation } from '@/types'

const mockRound: ConfirmationRound = {
  id: 'round-01',
  group_id: 'grp-01',
  selected_quotation_id: 'quote-01',
  round_number: 1,
  status: 'OPEN',
  deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
  notes: 'Selected Kisan Wholesale for best prices.',
  total_members: 3,
  confirmed_count: 2,
  rejected_count: 0,
  pending_count: 1,
  confirmations: [
    {
      id: 'conf-01',
      confirmation_round_id: 'round-01',
      group_id: 'grp-01',
      user_id: 'user-01',
      user_name: 'Priya Sharma',
      status: 'ACCEPTED',
      total_household_cost: 1475.0,
      total_household_savings: 325.0,
      confirmed_at: new Date().toISOString(),
      fulfillment_preference: 'HOME_DELIVERY',
      delivery_address: 'Flat 101, Palm Grove, Indiranagar',
      created_at: new Date().toISOString(),
    },
    {
      id: 'conf-02',
      confirmation_round_id: 'round-01',
      group_id: 'grp-01',
      user_id: 'user-02',
      user_name: 'Rahul Verma',
      status: 'ACCEPTED',
      total_household_cost: 1200.0,
      total_household_savings: 300.0,
      confirmed_at: new Date().toISOString(),
      fulfillment_preference: 'PICKUP',
      created_at: new Date().toISOString(),
    },
    {
      id: 'conf-03',
      confirmation_round_id: 'round-01',
      group_id: 'grp-01',
      user_id: 'user-03',
      user_name: 'Sneha Patel',
      status: 'PENDING',
      total_household_cost: 950.0,
      total_household_savings: 210.0,
      fulfillment_preference: 'PICKUP',
      created_at: new Date().toISOString(),
    },
  ],
  selected_quotation: {
    id: 'quote-01',
    demand_snapshot_id: 'snap-01',
    supplier_id: 'supp-01',
    supplier_name: 'Kisan Wholesale Agro Supplies',
    status: 'ACCEPTED',
    total_quoted_price: 3625.0,
    valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  created_at: new Date().toISOString(),
}

const mockOrder: GroupOrder = {
  id: 'order-locked-01',
  group_id: 'grp-01',
  selected_quotation_id: 'quote-01',
  confirmation_round_id: 'round-01',
  status: 'LOCKED',
  total_retail_amount: 4460.0,
  total_wholesale_amount: 3625.0,
  total_savings_amount: 835.0,
  total_packs: 12,
  locked_at: new Date().toISOString(),
  locked_by_user_id: 'user-02',
  supplier_name: 'Kisan Wholesale Agro Supplies',
  order_allocations_data: JSON.stringify({
    group_id: 'grp-01',
    group_name: 'Indiranagar Essentials Group #1',
    members: [
      {
        user_name: 'Priya Sharma',
        household_cost: 1475.0,
        household_savings: 325.0,
        fulfillment_preference: 'HOME_DELIVERY',
        delivery_address: 'Flat 101, Palm Grove',
      },
    ],
  }),
  created_at: new Date().toISOString(),
}

describe('Milestone 4 Frontend Components', () => {
  it('renders ConfirmationRoundPanel with aggregate approval progress', () => {
    render(
      <ConfirmationRoundPanel
        round={mockRound}
        isLoading={false}
        isOrganizer={true}
      />
    )

    expect(screen.getByText(/Confirmation Round 1/i)).toBeInTheDocument()
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
    expect(screen.queryByText('Rahul Verma')).not.toBeInTheDocument()
    expect(screen.queryByText('Sneha Patel')).not.toBeInTheDocument()
    expect(screen.getByText(/2 of 3 members approved/i)).toBeInTheDocument()
    expect(screen.getByText(/Lock Confirmed Order/i)).toBeInTheDocument()
  })

  it('renders MemberConfirmationModal with household costs and delivery toggle', () => {
    const myConf = mockRound.confirmations[0]

    render(
      <MemberConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        groupId="grp-01"
        groupName="Indiranagar Essentials Group #1"
        round={mockRound}
        myConfirmation={myConf}
      />
    )

    expect(screen.getByText(/Review & Confirm Final Order: Indiranagar Essentials Group #1/i)).toBeInTheDocument()
    expect(screen.getByText(/Kisan Wholesale Agro Supplies/i)).toBeInTheDocument()
    expect(screen.getByText(/Neighborhood Hub Pickup/i)).toBeInTheDocument()
    expect(screen.getByText(/Direct Home Delivery/i)).toBeInTheDocument()
    expect(screen.getByText(/Accept & Confirm Order/i)).toBeInTheDocument()
    expect(screen.getByText(/Have concerns\? Reject this quotation/i)).toBeInTheDocument()
  })

  it('renders LockedOrderCard with frozen allocations and immutable notice', () => {
    render(<LockedOrderCard order={mockOrder} />)

    expect(screen.getByText(/Immutable Locked Group Order/i)).toBeInTheDocument()
    expect(screen.getByText('Kisan Wholesale Agro Supplies')).toBeInTheDocument()
    expect(screen.getByText(/12 packs/i)).toBeInTheDocument()
    expect(screen.getByText(/LOCKED & FROZEN/i)).toBeInTheDocument()
    expect(screen.getByText(/Order Freezing Enforced:/i)).toBeInTheDocument()

    // Test toggle allocations
    const toggleBtn = screen.getByText(/View Frozen Allocation Details/i)
    fireEvent.click(toggleBtn)

    expect(screen.getByText(/Hide Frozen Allocation Details/i)).toBeInTheDocument()
    expect(screen.getByText('Your household allocation')).toBeInTheDocument()
    expect(screen.queryByText(/Flat 101, Palm Grove/i)).not.toBeInTheDocument()
  })
})
