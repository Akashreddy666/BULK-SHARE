import React, { useState, useEffect } from 'react'
import {
  Users,
  TrendingDown,
  ShoppingBag,
  Clock,
  Plus,
  KeyRound,
  MapPin,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BuyingGroup, Neighborhood } from '@/types'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { JoinByInviteModal } from '@/components/groups/JoinByInviteModal'
import { GroupDetailModal } from '@/components/groups/GroupDetailModal'
import { ProductCatalogModal } from '@/components/catalog/ProductCatalogModal'
import { HouseholdGroceryListModal } from '@/components/grocery/HouseholdGroceryListModal'

interface CustomerDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'my_groups' | 'explore' | 'orders'>('my_groups')
  const [groups, setGroups] = useState<BuyingGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<BuyingGroup | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [catalogGroup, setCatalogGroup] = useState<BuyingGroup | null>(null)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [listGroup, setListGroup] = useState<BuyingGroup | null>(null)
  const [isListOpen, setIsListOpen] = useState(false)

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      const data = await api.getGroups({
        my_groups_only: activeTab === 'my_groups',
        neighborhood_id: activeTab === 'explore' && user?.neighborhood_id ? user.neighborhood_id : undefined,
      })
      setGroups(data)
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'orders') {
      loadGroups()
    }
  }, [activeTab, user?.neighborhood_id])

  const handleGroupCreated = (newGroup: BuyingGroup) => {
    setGroups((prev) => [newGroup, ...prev])
    setCatalogGroup(newGroup)
    setIsCatalogOpen(true)
  }

  const handleGroupJoined = (joinedGroup: BuyingGroup) => {
    setGroups((prev) => prev.map((g) => (g.id === joinedGroup.id ? joinedGroup : g)))
    setCatalogGroup(joinedGroup)
    setIsCatalogOpen(true)
  }

  const handleOpenDetail = (group: BuyingGroup) => {
    setSelectedGroup(group)
    setIsDetailOpen(true)
  }

  const handleOpenCatalog = (group: BuyingGroup) => {
    setCatalogGroup(group)
    setIsCatalogOpen(true)
  }

  const handleOpenMyList = (group: BuyingGroup) => {
    setListGroup(group)
    setIsListOpen(true)
  }

  const handleJoinDirect = async (group: BuyingGroup) => {
    try {
      const updated = await api.joinGroup(group.id)
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
      handleOpenCatalog(updated)
    } catch {
      // handled
    }
  }

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.neighborhood?.name && g.neighborhood.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const myGroupsCount = groups.filter((g) => g.is_member).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile & Neighborhood */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.full_name}!</h1>
            <Badge variant="brand">Customer & Buyer</Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600" />
            Active Community:{' '}
            <span className="font-semibold text-slate-700">
              {user?.neighborhood?.name || 'Indiranagar Central'}
            </span>{' '}
            (Pincode: {user?.neighborhood?.postal_code || '560038'})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Persona
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsJoinCodeOpen(true)}>
            <KeyRound className="w-4 h-4 mr-1.5 text-slate-500" />
            Join with Code
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Buying Group
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">My Active Groups</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {myGroupsCount} Group{myGroupsCount === 1 ? '' : 's'}
              </h3>
              <p className="text-[11px] text-brand-600 font-medium mt-0.5">Pooling with neighbors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Estimated Bulk Savings</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">20% – 32%</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">vs individual retail store MRP</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Product Quality</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">100% Sealed</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Factory sealed packs only</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Grocery Catalog</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">5 Staples</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Rice, Oil, Dal, Sugar, Flour</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Groups Area */}
      <div className="space-y-6">
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my_groups')}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'my_groups'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Buying Groups
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'explore'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Explore Neighborhood Pools
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Past Orders & Tracking
            </button>
          </div>

          {activeTab !== 'orders' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'orders' ? (
          <Card>
            <CardContent className="p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Simulated Orders & Tracking</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once an organizer selects a quotation and all members confirm their allocations, orders undergo simulated wholesale procurement and pickup distribution (Milestone 4 & 5).
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Loading buying groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeTab === 'my_groups'
                    ? 'You have not joined any buying groups yet'
                    : 'No public groups found in this neighborhood'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {activeTab === 'my_groups'
                    ? 'Start your own group for your building or explore existing neighborhood pools.'
                    : 'Be the pioneer organizer and start the first grocery pooling group for your neighborhood!'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Buying Group
                </Button>
                {activeTab === 'my_groups' && (
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('explore')}>
                    Explore Pools
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                onSelect={handleOpenDetail}
                onJoin={handleJoinDirect}
                onOpenMyList={handleOpenMyList}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleGroupCreated}
        defaultNeighborhoodId={user?.neighborhood_id}
      />

      <JoinByInviteModal
        isOpen={isJoinCodeOpen}
        onClose={() => setIsJoinCodeOpen(false)}
        onSuccess={handleGroupJoined}
      />

      <GroupDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        group={selectedGroup}
        onGroupUpdated={(updated) => {
          setSelectedGroup(updated)
          setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
        }}
        onOpenCatalog={handleOpenCatalog}
        onOpenMyList={handleOpenMyList}
      />

      {catalogGroup && (
        <ProductCatalogModal
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          groupId={catalogGroup.id}
          groupName={catalogGroup.name}
          onItemAdded={() => {
            // refresh
          }}
        />
      )}

      {listGroup && (
        <HouseholdGroceryListModal
          isOpen={isListOpen}
          onClose={() => setIsListOpen(false)}
          groupId={listGroup.id}
          groupName={listGroup.name}
          onOpenCatalog={() => {
            setIsListOpen(false)
            setCatalogGroup(listGroup)
            setIsCatalogOpen(true)
          }}
        />
      )}
    </div>
  )
}
