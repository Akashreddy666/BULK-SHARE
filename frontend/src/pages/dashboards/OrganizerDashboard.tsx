import { useState, useEffect } from 'react'
import {
  Users,
  Layers,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Settings,
  Plus,
  Lock,
  Vote,
} from 'lucide-react'
import { Dashboard, DashboardHeader, DashboardNav, Metric, PanelError, PanelLoading } from '@/components/dashboard/Dashboard'
import { ActionDialog, type PendingAction } from '@/components/ui/ActionDialog'
import { GroupSettingsModal } from '@/components/groups/GroupSettingsModal'
import { useToast } from '@/components/ui/Toast'
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

const sections = [
  { id: 'groups', label: 'Overview & groups', icon: Users },
  { id: 'demand', label: 'Demand & tiers', icon: Layers },
  { id: 'quotations', label: 'Quotations', icon: FileCheck },
  { id: 'confirmations', label: 'Confirmations', icon: Vote },
  { id: 'order', label: 'Order & pickup', icon: Lock },
] as const

const lifecycle = [
  { label: 'Collecting items', statuses: ['OPEN'] },
  { label: 'Supplier quotes', statuses: ['CLOSED', 'QUOTING'] },
  { label: 'Confirmations', statuses: ['CONFIRMING'] },
  { label: 'Order locked', statuses: ['LOCKED', 'PROCUREMENT'] },
  { label: 'Fulfillment', statuses: ['FULFILLMENT', 'COMPLETED'] },
]

export function OrganizerDashboard({ onOpenHousehold }: { onOpenHousehold: () => void }) {
  const { user } = useAuth()
  const notify = useToast()
  const [loadError, setLoadError] = useState('')
  const [viewError, setViewError] = useState('')
  const [retryView, setRetryView] = useState(0)
  const [action, setAction] = useState<PendingAction | null>(null)
  const [editingGroup, setEditingGroup] = useState<BuyingGroup | null>(null)
  const [organizedGroups, setOrganizedGroups] = useState<BuyingGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<typeof sections[number]['id']>('groups')
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
    setLoadError('')
    try {
      const data = await api.getGroups({ my_groups_only: true })
      const filtered = data.filter((g) => g.is_organizer)
      setOrganizedGroups(filtered)
      if (filtered.length > 0 && !activeGroupId) {
        setActiveGroupId(filtered[0].id)
      }
    } catch {
      setLoadError('Your organized groups could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizedGroups()
  }, [])

  useEffect(() => {
    if (!activeGroupId) return
    let active = true
    setViewError('')

    if (activeTab === 'demand') {
      setIsDemandLoading(true)
      setDemandError(null)
      setDemandSummary(null)
      api.getDemandSummary(activeGroupId)
        .then((data) => { if (active) setDemandSummary(data) })
        .catch((error) => { if (active) setDemandError(error.message || 'Could not load demand.') })
        .finally(() => { if (active) setIsDemandLoading(false) })
    } else if (activeTab === 'quotations') {
      setIsQuotesLoading(true)
      setQuotations([])
      api.getGroupQuotations(activeGroupId)
        .then((data) => { if (active) setQuotations(data) })
        .catch(() => { if (active) setViewError('Supplier quotations could not be loaded.') })
        .finally(() => { if (active) setIsQuotesLoading(false) })
    } else if (activeTab === 'confirmations') {
      setIsRoundLoading(true)
      setConfirmationRound(null)
      api.getConfirmationRound(activeGroupId)
        .then((data) => { if (active) setConfirmationRound(data) })
        .catch(() => { if (active) setViewError('The confirmation round could not be loaded.') })
        .finally(() => { if (active) setIsRoundLoading(false) })
    } else if (activeTab === 'order') {
      setIsOrderLoading(true)
      setGroupOrder(null)
      api.getGroupOrder(activeGroupId)
        .then((data) => { if (active) setGroupOrder(data) })
        .catch(() => { if (active) setViewError('The group order could not be loaded.') })
        .finally(() => { if (active) setIsOrderLoading(false) })
    }
    return () => { active = false }
  }, [activeGroupId, activeTab, retryView])

  const handleGroupCreated = (newGroup: BuyingGroup) => {
    setOrganizedGroups((prev) => [newGroup, ...prev])
    setActiveGroupId(newGroup.id)
    setSelectedGroup(newGroup)
    setIsDetailOpen(true)
  }

  const updateStatus = (id: string, status: BuyingGroup['status']) => {
    setOrganizedGroups((previous) => previous.map((group) => group.id === id ? { ...group, status } : group))
  }

  const handleRequestQuotations = async () => {
    if (!activeGroupId) return
    setAction({
      title: 'Publish group demand?',
      description: 'This takes a snapshot of pooled pack quantities and opens the group to supplier quotations.',
      label: 'Publish demand',
      run: async () => {
        await api.triggerDemandSnapshot(activeGroupId)
        updateStatus(activeGroupId, 'QUOTING')
        setActiveTab('quotations')
        notify('Demand published for supplier quotations.')
      },
    })
  }

  const handleSelectQuotation = async (quote: SupplierQuotation) => {
    if (!activeGroupId) return
    setAction({
      title: 'Select this quotation?',
      description: `Selecting ${quote.supplier_name || 'this supplier'} starts the first household confirmation round.`,
      label: 'Select quotation',
      run: async () => {
        const round = await api.selectQuotation(activeGroupId, {
          quotation_id: quote.id,
          deadline_hours: 48,
          notes: `Selected quotation from ${quote.supplier_name || 'Wholesaler'}.`,
        })
        setConfirmationRound(round)
        updateStatus(activeGroupId, 'CONFIRMING')
        setActiveTab('confirmations')
        notify('Quotation selected. Households can now confirm.')
      },
    })
  }

  const handleLockOrder = async () => {
    if (!activeGroupId) return
    setAction({
      title: 'Lock this group order?',
      description: 'Locking freezes the pack quantities and costs. Changes after locking require an administrator.',
      label: 'Lock group order',
      run: async () => {
        const order = await api.lockGroupOrder(activeGroupId)
        setGroupOrder(order)
        updateStatus(activeGroupId, 'LOCKED')
        setActiveTab('order')
        notify('Group order locked.')
      },
    })
  }

  const handleRecalculate = async () => {
    if (!activeGroupId) return
    setAction({
      title: 'Start the final confirmation round?',
      description: 'The order will be recalculated without households that rejected the quotation. This is the final round.',
      label: 'Recalculate order',
      run: async () => {
        const round = await api.recalculateOrder(activeGroupId)
        setConfirmationRound(round)
        if (round.status === 'FAILED') updateStatus(activeGroupId, 'CANCELLED')
        notify('Order recalculation completed.')
      },
    })
  }

  const activeGroup = organizedGroups.find((group) => group.id === activeGroupId)
  const currentStep = lifecycle.findIndex(({ statuses }) => statuses.includes(activeGroup?.status ?? ''))

  return (
    <Dashboard>
      <DashboardHeader role="Neighborhood group organizer" title="Organize your buying groups" description={`Pool demand, compare supplier quotes and coordinate orders in ${user?.neighborhood?.name || 'your neighborhood'}.`} icon={Users}>
        <Button variant="secondary" onClick={onOpenHousehold}><ShoppingBag aria-hidden="true" className="size-4" /> Household dashboard</Button>
        <Button variant="outline" onClick={() => setIsCreateOpen(true)}><Plus aria-hidden="true" className="size-4" /> Create buying group</Button>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Groups you organize" value={isLoading || loadError ? '—' : organizedGroups.length} icon={Users} />
        <Metric label="Households in selected group" value={activeGroup?.members_count ?? '—'} icon={CheckCircle2} />
        <Metric label="Selected group status" value={activeGroup ? activeGroup.status.toLowerCase().replace(/_/g, ' ') : '—'} icon={Clock} />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
        <ShieldCheck aria-hidden="true" className="size-5 shrink-0" />
        <p>Group demand combines pack counts. Household grocery lists and delivery addresses stay private.</p>
      </div>

      {activeGroup && (
        <div className="space-y-4 rounded-panel border border-line bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 basis-56">
              <label htmlFor="active-organizer-group" className="mb-1.5 block text-sm font-bold">Selected group</label>
              <select id="active-organizer-group" className="control w-full" value={activeGroupId ?? ''} onChange={(event) => setActiveGroupId(event.target.value)}>
                {organizedGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </div>
            {activeGroup.status === 'OPEN' && <Button variant="outline" onClick={() => setEditingGroup(activeGroup)}><Settings aria-hidden="true" className="size-4" /> Group settings</Button>}
          </div>
          {currentStep >= 0 && (
            <ol aria-label="Group timeline" className="grid gap-2 sm:grid-cols-5">
              {lifecycle.map(({ label }, index) => (
                <li key={label} aria-current={index === currentStep ? 'step' : undefined} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${index === currentStep ? 'bg-brand-50 font-bold text-brand-950' : 'text-slate-600'}`}>
                  {index < currentStep ? <CheckCircle2 aria-label="Complete" className="size-4 shrink-0 text-brand-700" /> : <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${index === currentStep ? 'bg-brand-700' : 'bg-line'}`} />}
                  {label}
                </li>
              ))}
            </ol>
          )}
          <div className="border-t border-line pt-3">
            <DashboardNav label="Organizer views" items={sections} value={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      )}

      {viewError && <PanelError message={viewError} onRetry={() => setRetryView((value) => value + 1)} />}
      {/* Tab 1: Overview & All Organized Groups */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
            <PanelLoading label="Loading organized groups" />
          ) : loadError ? (
            <PanelError message={loadError} onRetry={loadOrganizedGroups} />
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
                <div key={g.id} className="flex min-w-0 flex-col">
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
      {activeTab === 'quotations' && !viewError && (
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
      {activeTab === 'confirmations' && !viewError && (
        <ConfirmationRoundPanel
          round={confirmationRound}
          isLoading={isRoundLoading}
          isOrganizer={true}
          onLockOrder={handleLockOrder}
          onRecalculate={handleRecalculate}
        />
      )}

      {/* Tab 5: Locked Order */}
      {activeTab === 'order' && !viewError && (
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

      <ActionDialog action={action} onClose={() => setAction(null)} />
      {editingGroup && (
        <GroupSettingsModal key={editingGroup.id} group={editingGroup} onClose={() => setEditingGroup(null)} onSave={(updated) => {
          setOrganizedGroups((previous) => previous.map((group) => group.id === updated.id ? updated : group))
          setEditingGroup(null)
          notify('Group settings saved.')
        }} />
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleGroupCreated}
        defaultNeighborhoodId={user?.neighborhood_id}
      />

      <GroupDetailModal
        key={selectedGroup?.id}
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
          key={catalogGroup.id}
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          groupId={catalogGroup.id}
          groupName={catalogGroup.name}
        />
      )}

      {listGroup && (
        <HouseholdGroceryListModal
          key={listGroup.id}
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
    </Dashboard>
  )
}
