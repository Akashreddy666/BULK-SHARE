import React, { useState, useEffect } from 'react'
import {
  Users,
  Layers,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Lock,
  Vote,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  BuyingGroup,
  DemandSummaryResponse,
  SupplierQuotation,
  ConfirmationRound,
  GroupOrder,
} from '@/types'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { GroupDetailModal } from '@/components/groups/GroupDetailModal'
import { ProductCatalogModal } from '@/components/catalog/ProductCatalogModal'
import { HouseholdGroceryListModal } from '@/components/grocery/HouseholdGroceryListModal'
import { DemandSummaryPanel } from '@/components/aggregation/DemandSummaryPanel'
import { QuotationComparisonView } from '@/components/quotation/QuotationComparisonView'
import { ConfirmationRoundPanel } from '@/components/confirmation/ConfirmationRoundPanel'
import { LockedOrderCard } from '@/components/order/LockedOrderCard'
import { HubPickupDesk } from '@/components/fulfillment/HubPickupDesk'

interface OrganizerDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [organizedGroups, setOrganizedGroups] = useState<BuyingGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'groups' | 'demand' | 'quotations' | 'confirmations' | 'order'>('groups')
  const [isLoading, setIsLoading] = useState(true)

  // Demand aggregation & quotations state for active group
  const [demandSummary, setDemandSummary] = useState<DemandSummaryResponse | null>(null)
  const [isDemandLoading, setIsDemandLoading] = useState(false)
  const [demandError, setDemandError] = useState<string | null>(null)

  const [quotations, setQuotations] = useState<SupplierQuotation[]>([])
  const [isQuotesLoading, setIsQuotesLoading] = useState(false)

  // Milestone 4: Confirmation Round & Locked Order
  const [confirmationRound, setConfirmationRound] = useState<ConfirmationRound | null>(null)
  const [isRoundLoading, setIsRoundLoading] = useState(false)
  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null)
  const [isOrderLoading, setIsOrderLoading] = useState(false)

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<BuyingGroup | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [catalogGroup, setCatalogGroup] = useState<BuyingGroup | null>(null)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [listGroup, setListGroup] = useState<BuyingGroup | null>(null)
  const [isListOpen, setIsListOpen] = useState(false)

  const loadOrganizedGroups = async () => {
    setIsLoading(true)
    try {
      const data = await api.getGroups({ my_groups_only: true })
      const filtered = data.filter((g) => g.is_organizer)
      setOrganizedGroups(filtered)
      if (filtered.length > 0 && !activeGroupId) {
        setActiveGroupId(filtered[0].id)
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizedGroups()
  }, [])

  // Load relevant tab data whenever activeGroupId or activeTab changes
  useEffect(() => {
    if (!activeGroupId) return

    if (activeTab === 'demand') {
      setIsDemandLoading(true)
      setDemandError(null)
      api
        .getDemandSummary(activeGroupId)
        .then((data) => setDemandSummary(data))
        .catch((err) => setDemandError(err.message || 'Failed to load demand summary'))
        .finally(() => setIsDemandLoading(false))
    } else if (activeTab === 'quotations') {
      setIsQuotesLoading(true)
      api
        .getGroupQuotations(activeGroupId)
        .then((data) => setQuotations(data))
        .catch(() => setQuotations([]))
        .finally(() => setIsQuotesLoading(false))
    } else if (activeTab === 'confirmations') {
      setIsRoundLoading(true)
      api
        .getConfirmationRound(activeGroupId)
        .then((data) => setConfirmationRound(data))
        .catch(() => setConfirmationRound(null))
        .finally(() => setIsRoundLoading(false))
    } else if (activeTab === 'order') {
      setIsOrderLoading(true)
      api
        .getGroupOrder(activeGroupId)
        .then((data) => setGroupOrder(data))
        .catch(() => setGroupOrder(null))
        .finally(() => setIsOrderLoading(false))
    }
  }, [activeGroupId, activeTab])

  const handleGroupCreated = (newGroup: BuyingGroup) => {
    setOrganizedGroups((prev) => [newGroup, ...prev])
    setActiveGroupId(newGroup.id)
    setSelectedGroup(newGroup)
    setIsDetailOpen(true)
  }

  const handleRequestQuotations = async () => {
    if (!activeGroupId) return
    await api.triggerDemandSnapshot(activeGroupId)
    const updatedSummary = await api.getDemandSummary(activeGroupId)
    setDemandSummary(updatedSummary)
    setOrganizedGroups((prev) =>
      prev.map((g) => (g.id === activeGroupId ? { ...g, status: 'QUOTING' } : g))
    )
    setActiveTab('quotations')
  }

  const handleSelectQuotation = async (quote: SupplierQuotation) => {
    if (!activeGroupId) return
    if (!window.confirm(`Select ${quote.supplier_name} as the supplier for this purchase? This will start Member Confirmation Round 1.`)) {
      return
    }

    try {
      const round = await api.selectQuotation(activeGroupId, {
        quotation_id: quote.id,
        deadline_hours: 48,
        notes: `Selected quotation from ${quote.supplier_name || 'Wholesaler'}.`,
      })
      setConfirmationRound(round)
      setOrganizedGroups((prev) =>
        prev.map((g) => (g.id === activeGroupId ? { ...g, status: 'CONFIRMING' } : g))
      )
      setActiveTab('confirmations')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to select quotation')
    }
  }

  const handleLockOrder = async () => {
    if (!activeGroupId) return
    if (!window.confirm('Lock this group order? Once locked, quantities and allocation values are frozen, and members cannot cancel without admin intervention.')) {
      return
    }

    try {
      const order = await api.lockGroupOrder(activeGroupId)
      setGroupOrder(order)
      setOrganizedGroups((prev) =>
        prev.map((g) => (g.id === activeGroupId ? { ...g, status: 'LOCKED' } : g))
      )
      setActiveTab('order')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to lock order')
    }
  }

  const handleRecalculate = async () => {
    if (!activeGroupId) return
    if (!window.confirm('Trigger order recalculation? Rejecting members will be removed and Round 2 will open. Note: this is the final confirmation round allowed.')) {
      return
    }

    try {
      const round2 = await api.recalculateOrder(activeGroupId)
      setConfirmationRound(round2)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to recalculate order')
    }
  }

  const activeGroup = organizedGroups.find((g) => g.id === activeGroupId) || organizedGroups[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">Group Organizer Console</h1>
            <Badge variant="brand">Organizer Scope</Badge>
          </div>
          <p className="text-sm text-stone-500">
            Welcome, <span className="font-semibold text-stone-800">{user?.full_name}</span>. Managing community bulk purchasing pools in {user?.neighborhood?.name || 'your neighborhood'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Persona
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Start New Group
          </Button>
        </div>
      </div>

      {/* Privacy Notice (FR-LIST-04) */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Privacy-Preserving Aggregated Demand Only (FR-LIST-04)</p>
          <p className="mt-0.5 text-teal-800 leading-relaxed">
            As a neighborhood group organizer, you have administrative permission to manage group settings, generate invitation codes, and monitor aggregated grocery quantities. Individual household grocery lists and delivery addresses are kept strictly private and sealed.
          </p>
        </div>
      </div>

      {/* Group Navigation Tabs & Selector */}
      {organizedGroups.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-stone-500 uppercase whitespace-nowrap">
              Active Group:
            </span>
            <select
              value={activeGroupId || ''}
              onChange={(e) => setActiveGroupId(e.target.value)}
              className="px-3 py-1.5 text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-auto"
            >
              {organizedGroups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name} ({grp.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Overview & Groups
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demand')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'demand'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Demand & Tiers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quotations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'quotations'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Quotations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('confirmations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'confirmations'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              Confirmations (M4)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'order'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Locked Order
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Overview & All Organized Groups */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-stone-900">My Organized Buying Groups</h3>
              <p className="text-xs text-stone-500">
                Groups you created or manage as neighborhood coordinator.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Another Group
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              Loading your organized groups...
            </div>
          ) : organizedGroups.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-stone-300 mx-auto" />
                <h4 className="text-sm font-bold text-stone-900">No Groups Organized Yet</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Create a buying group for your apartment society or residential street to begin aggregating staple groceries.
                </p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Buying Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizedGroups.map((g) => (
                <div key={g.id} className="relative">
                  <GroupCard
                    group={g}
                    onSelect={(grp) => {
                      setSelectedGroup(grp)
                      setIsDetailOpen(true)
                    }}
                    onOpenMyList={(grp) => {
                      setListGroup(grp)
                      setIsListOpen(true)
                    }}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs py-1"
                      onClick={() => {
                        setActiveGroupId(g.id)
                        setActiveTab('demand')
                      }}
                    >
                      <Layers className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      View Demand & Tiers
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pooled Demand & Wholesale Tiers */}
      {activeTab === 'demand' && (
        <DemandSummaryPanel
          groupId={activeGroupId || ''}
          group={activeGroup}
          summary={demandSummary}
          isLoading={isDemandLoading}
          error={demandError}
          isOrganizer={true}
          onRequestQuotations={handleRequestQuotations}
        />
      )}

      {/* Tab 3: Wholesale Quotations */}
      {activeTab === 'quotations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Wholesale Supplier Quotations for {activeGroup?.name || 'Selected Group'}
              </h3>
              <p className="text-xs text-stone-500">
                Select the most suitable quotation to advance to Member Confirmation Round 1.
              </p>
            </div>
            {activeGroup?.status === 'OPEN' && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleRequestQuotations}
              >
                Publish Demand Snapshot
              </Button>
            )}
          </div>

          <QuotationComparisonView
            quotations={quotations}
            isLoading={isQuotesLoading}
            isOrganizer={true}
            onSelectQuotation={handleSelectQuotation}
          />
        </div>
      )}

      {/* Tab 4: Member Confirmations (Milestone 4) */}
      {activeTab === 'confirmations' && (
        <ConfirmationRoundPanel
          round={confirmationRound}
          isLoading={isRoundLoading}
          isOrganizer={true}
          onLockOrder={handleLockOrder}
          onRecalculate={handleRecalculate}
        />
      )}

      {/* Tab 5: Locked Order */}
      {activeTab === 'order' && (
        <div className="space-y-4">
          {isOrderLoading ? (
            <div className="p-10 text-center text-stone-400 text-xs">Loading locked order details...</div>
          ) : groupOrder ? (
            <div className="space-y-6">
              <LockedOrderCard order={groupOrder} />
              <HubPickupDesk groupOrderId={groupOrder.id} groupName={activeGroup?.name} />
            </div>
          ) : (
            <Card className="p-8 text-center bg-stone-50 border border-stone-200">
              <h4 className="text-base font-bold text-stone-900">No Order Locked Yet</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Once member approvals are completed in the Confirmation Round, click &quot;Lock Group Order&quot; to freeze allocations and generate the purchase order.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleGroupCreated}
        defaultNeighborhoodId={user?.neighborhood_id}
      />

      <GroupDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        group={selectedGroup}
        onGroupUpdated={(updated) => {
          setSelectedGroup(updated)
          setOrganizedGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
        }}
        onOpenCatalog={(grp) => {
          setCatalogGroup(grp)
          setIsCatalogOpen(true)
        }}
        onOpenMyList={(grp) => {
          setListGroup(grp)
          setIsListOpen(true)
        }}
      />

      {catalogGroup && (
        <ProductCatalogModal
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          groupId={catalogGroup.id}
          groupName={catalogGroup.name}
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
