import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GroupCard } from '@/components/groups/GroupCard'
import { BuyingGroup } from '@/types'

const mockPublicGroup: BuyingGroup = {
  id: 'group-indiranagar-01',
  name: 'Indiranagar Rice & Oil Club',
  description: 'Weekly staple groceries pool for 100ft road',
  neighborhood_id: 'test-neigh-01',
  organizer_id: 'user-01',
  visibility: 'PUBLIC',
  status: 'OPEN',
  deadline: '2026-11-25T20:00:00Z',
  close_rule: 'DEADLINE_OR_TARGET',
  min_members: 5,
  max_members: 20,
  version: 1,
  created_at: '2026-11-19T00:00:00Z',
  updated_at: '2026-11-19T00:00:00Z',
  neighborhood: {
    id: 'test-neigh-01',
    name: 'Indiranagar Central',
    city: 'Bengaluru',
    postal_code: '560038',
    is_active: true,
  },
  members_count: 3,
  is_member: false,
  is_organizer: false,
}

const mockJoinedPrivateGroup: BuyingGroup = {
  ...mockPublicGroup,
  id: 'group-defense-02',
  name: 'Defense Colony Gated Group',
  visibility: 'PRIVATE',
  is_member: true,
  is_organizer: true,
  members_count: 5,
}

describe('Milestone 2 - Buying Groups and Catalog Tests', () => {
  it('renders a public group card with member threshold progress and join action', () => {
    const handleSelect = vi.fn()
    const handleJoin = vi.fn()

    render(
      <GroupCard
        group={mockPublicGroup}
        onSelect={handleSelect}
        onJoin={handleJoin}
      />
    )

    expect(screen.getByText('Indiranagar Rice & Oil Club')).toBeInTheDocument()
    expect(screen.getByText('Indiranagar Central')).toBeInTheDocument()
    expect(screen.getByText(/Public Pool/i)).toBeInTheDocument()
    expect(screen.getByText(/OPEN FOR ITEMS/i)).toBeInTheDocument()
    expect(screen.getByText('3 / 5 Households')).toBeInTheDocument()

    const joinBtn = screen.getByRole('button', { name: /Join Group/i })
    expect(joinBtn).toBeInTheDocument()
    fireEvent.click(joinBtn)
    expect(handleJoin).toHaveBeenCalledWith(mockPublicGroup)
  })

  it('renders an organized private group card with Organizer badge and My Grocery List action', () => {
    const handleSelect = vi.fn()
    const handleOpenMyList = vi.fn()

    render(
      <GroupCard
        group={mockJoinedPrivateGroup}
        onSelect={handleSelect}
        onOpenMyList={handleOpenMyList}
      />
    )

    expect(screen.getByText('Defense Colony Gated Group')).toBeInTheDocument()
    expect(screen.getByText(/Private Group/i)).toBeInTheDocument()
    expect(screen.getByText(/You Organize/i)).toBeInTheDocument()
    expect(screen.getByText(/Minimum threshold reached/i)).toBeInTheDocument()

    const myListBtn = screen.getByRole('button', { name: /My Grocery List/i })
    expect(myListBtn).toBeInTheDocument()
    fireEvent.click(myListBtn)
    expect(handleOpenMyList).toHaveBeenCalledWith(mockJoinedPrivateGroup)
  })
})
