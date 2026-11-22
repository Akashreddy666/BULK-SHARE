import { useState, useEffect } from 'react'
import { CircleDollarSign, ClipboardList, Clock, KeyRound, MapPin, Plus, Search, ShoppingBag, Users } from 'lucide-react'
import { Dashboard, DashboardHeader, DashboardNav, Metric, PanelError, PanelLoading } from '@/components/dashboard/Dashboard'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { BuyingGroup, ConfirmationRound, GroupOrder, MemberFulfillment, HouseholdInvoice, HouseholdSavingsResponse } from '@/types'
import { api, ApiError } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { JoinByInviteModal } from '@/components/groups/JoinByInviteModal'
import { GroupDetailModal } from '@/components/groups/GroupDetailModal'
import { ProductCatalogModal } from '@/components/catalog/ProductCatalogModal'
import { HouseholdGroceryListModal } from '@/components/grocery/HouseholdGroceryListModal'
import { HouseholdSavingsModal } from '@/components/savings/HouseholdSavingsModal'
import { MemberConfirmationModal } from '@/components/confirmation/MemberConfirmationModal'
import { PickupPassCard } from '@/components/fulfillment/PickupPassCard'

const sections = [
  { id: 'my_groups', label: 'My buying groups', icon: Users },
  { id: 'explore', label: 'Nearby groups', icon: MapPin },
  { id: 'orders', label: 'Orders & tracking', icon: Clock },
] as const

const orderedStatuses = ['LOCKED', 'PROCUREMENT', 'FULFILLMENT', 'COMPLETED']

type CustomerSection = typeof sections[number]['id']

export function CustomerDashboard({ onOpenOrganizer }: { onOpenOrganizer: () => void }) {
  const { user } = useAuth()
  const notify = useToast()
  const [activeTab, setActiveTab] = useState<CustomerSection>('my_groups')
  const [groups, setGroups] = useState<BuyingGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [groupError, setGroupError] = useState('')
  const [orderError, setOrderError] = useState('')
  const [savings, setSavings] = useState<HouseholdSavingsResponse[]>([])
  const [savingsPending, setSavingsPending] = useState(true)
  const [savingsRevision, setSavingsRevision] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<BuyingGroup | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [catalogGroup, setCatalogGroup] = useState<BuyingGroup | null>(null)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [listGroup, setListGroup] = useState<BuyingGroup | null>(null)
  const [isListOpen, setIsListOpen] = useState(false)
  const [savingsGroup, setSavingsGroup] = useState<BuyingGroup | null>(null)
  const [isSavingsOpen, setIsSavingsOpen] = useState(false)
  const [confirmGroup, setConfirmGroup] = useState<BuyingGroup | null>(null)
  const [confirmRound, setConfirmRound] = useState<ConfirmationRound | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [userOrders, setUserOrders] = useState<
    { group: BuyingGroup; order: GroupOrder; fulfillment?: MemberFulfillment | null; invoice?: HouseholdInvoice | null }[]
  >([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)

  const loadOrdersData = async () => {
    setIsOrdersLoading(true)
    setOrderError('')
    try {
      const myOrders = await Promise.all(groups.filter((group) => group.is_member && orderedStatuses.includes(group.status)).map(async (group) => {
        const order = await api.getGroupOrder(group.id)
        if (!order) return null

        try {
          const [invoice, fulfillments] = await Promise.all([
            api.getHouseholdInvoice(order.id),
            api.getOrderFulfillments(order.id).catch((error: unknown) => {
              if (error instanceof ApiError && error.status === 404) return []
              throw error
            }),
          ])
          const fulfillment = fulfillments.find((entry) => entry.user_id === user?.id)
          return { group, order, invoice, fulfillment }
        } catch (error) {
          if (error instanceof ApiError && [403, 404].includes(error.status)) return null
          throw error
        }
      }))
      setUserOrders(myOrders.filter((entry) => entry !== null))
    } catch {
      setOrderError('Your orders could not be loaded.')
    } finally {
      setIsOrdersLoading(false)
    }
  }

  const loadGroups = async () => {
    setIsLoading(true)
    setGroupError('')
    try {
      const data = await api.getGroups()
      setGroups(data)
    } catch {
      setGroupError('Your buying groups could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadGroups() }, [])

  useEffect(() => {
    if (activeTab === 'orders' && !isLoading && !groupError) void loadOrdersData()
  }, [activeTab, groups, isLoading, groupError])

  useEffect(() => {
    if (isLoading || groupError) return
    let active = true
    setSavingsPending(true)
    const activeGroups = groups.filter((group) => group.is_member && !orderedStatuses.includes(group.status) && group.status !== 'CANCELLED')

    Promise.allSettled(activeGroups.map((group) => api.getMySavings(group.id))).then((responses) => {
      if (!active) return
      setSavings(responses.flatMap((response) => response.status === 'fulfilled' ? [response.value] : []))
      setSavingsPending(false)
    })
    return () => { active = false }
  }, [groups, isLoading, groupError, savingsRevision])

  const updateGroup = (group: BuyingGroup) => {
    setGroups((previous) => previous.some((entry) => entry.id === group.id)
      ? previous.map((entry) => entry.id === group.id ? group : entry)
      : [group, ...previous])
  }

  const handleGroupCreated = (newGroup: BuyingGroup) => {
    updateGroup(newGroup)
    setActiveTab('my_groups')
    notify('Buying group created.')
    setCatalogGroup(newGroup)
    setIsCatalogOpen(true)
  }

  const handleGroupJoined = (joinedGroup: BuyingGroup) => {
    updateGroup(joinedGroup)
    notify('You joined the buying group.')
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
    setJoiningGroupId(group.id)
    try {
      const updated = await api.joinGroup(group.id)
      handleGroupJoined(updated)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not join that group.', 'error')
    } finally {
      setJoiningGroupId(null)
    }
  }

  const search = searchTerm.trim().toLowerCase()
  const myGroups = groups.filter((group) => group.is_member)
  const nearbyGroups = groups.filter((group) => group.visibility === 'PUBLIC')
  const filteredGroups = (activeTab === 'my_groups' ? myGroups : nearbyGroups).filter((group) =>
    (!openOnly || group.status === 'OPEN') &&
    [group.name, group.neighborhood?.name].some((value) => value?.toLowerCase().includes(search))
  )
  const activeGroupCount = myGroups.filter((group) => !['CANCELLED', 'COMPLETED'].includes(group.status)).length
  const hasSavings = savings.some((entry) => entry.total_packs > 0)
  const estimatedSavings = savings.reduce((sum, entry) => sum + entry.total_savings, 0)
  const totalPacks = savings.reduce((sum, entry) => sum + entry.total_packs, 0)

  return (
    <Dashboard>
      <DashboardHeader
        role="Household dashboard"
        title={`Welcome, ${user?.full_name?.trim().split(/\s+/)[0] || 'neighbor'}!`}
        description={user?.neighborhood ? <span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" className="size-4" />{user.neighborhood.name} · {user.neighborhood.postal_code}</span> : 'Find a buying group and start your household grocery list.'}
        icon={ShoppingBag}
      >
        {myGroups.some((group) => group.is_organizer) && <Button variant="secondary" onClick={onOpenOrganizer}>Manage my groups</Button>}
        <Button variant="secondary" onClick={() => setIsJoinCodeOpen(true)}><KeyRound aria-hidden="true" className="size-4" /> Join with code</Button>
        <Button variant="outline" onClick={() => setIsCreateOpen(true)}><Plus aria-hidden="true" className="size-4" /> Create buying group</Button>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Active buying groups" value={isLoading || groupError ? '—' : activeGroupCount} icon={Users} />
        <Metric label="Estimated savings" value={savingsPending || groupError || !hasSavings ? '—' : formatCurrency(estimatedSavings)} icon={CircleDollarSign} caption="Across active groups before final charges" />
        <Metric label="Packs on your grocery lists" value={savingsPending || groupError ? '—' : totalPacks} icon={ClipboardList} caption="Your household only" />
      </div>

      <section className="space-y-4" aria-label="Shopping workspace">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-white p-3">
          <DashboardNav label="Shopping views" items={sections} value={activeTab} onChange={setActiveTab} />
          {activeTab !== 'orders' && (
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <div className="relative min-w-0 flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
                <input type="search" aria-label="Search buying groups" placeholder="Search groups" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="control w-full pl-9" />
              </div>
              <label className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-sm font-semibold">
                <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} className="size-4 accent-brand-700" /> Open only
              </label>
            </div>
          )}
        </div>
        {/* Content based on Active Tab */}
        {groupError ? <PanelError message={groupError} onRetry={loadGroups} /> : activeTab === 'orders' ? (
          isOrdersLoading || isLoading ? (
            <PanelLoading label="Loading orders" />
          ) : orderError ? (
            <PanelError message={orderError} onRetry={loadOrdersData} />
          ) : userOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Orders in Fulfillment Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Once your group purchase order is locked and approved, your household payment receipts, pickup PIN code passes, and doorstep delivery trackers will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {userOrders.map((item) => (
                <PickupPassCard
                  key={item.order.id}
                  fulfillment={item.fulfillment}
                  groupOrderId={item.order.id}
                  invoice={item.invoice}
                  onRefresh={loadOrdersData}
                />
              ))}
            </div>
          )
        ) : isLoading ? (
          <PanelLoading label="Loading buying groups" />
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {search || openOnly ? 'No groups match your filters' : activeTab === 'my_groups'
                    ? 'You have not joined any buying groups yet'
                    : 'No public groups found in this neighborhood'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {search || openOnly ? 'Try a different search or include groups at every stage.' : activeTab === 'my_groups'
                    ? 'Start your own group for your building or explore existing neighborhood pools.'
                    : 'Be the pioneer organizer and start the first grocery pooling group for your neighborhood!'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
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
                isJoining={joiningGroupId === g.id}
                onOpenMyList={handleOpenMyList}
              />
            ))}
          </div>
        )}
      </section>

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
          updateGroup(updated)
        }}
        onOpenCatalog={handleOpenCatalog}
        onOpenMyList={handleOpenMyList}
        onOpenSavings={(grp) => {
          setSavingsGroup(grp)
          setIsSavingsOpen(true)
        }}
        onOpenConfirmation={async (grp) => {
          try {
            const r = await api.getConfirmationRound(grp.id)
            if (!r) {
              notify('The confirmation round has not opened yet.', 'error')
              return
            }
            setConfirmGroup(grp)
            setConfirmRound(r)
            setIsConfirmOpen(true)
          } catch (err: unknown) {
            notify(err instanceof Error ? err.message : 'Could not load the confirmation round.', 'error')
          }
        }}
      />

      {confirmGroup && (
        <MemberConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          groupId={confirmGroup.id}
          groupName={confirmGroup.name}
          round={confirmRound}
          onConfirmed={() => {
            loadGroups()
          }}
        />
      )}

      {savingsGroup && (
        <HouseholdSavingsModal
          isOpen={isSavingsOpen}
          onClose={() => setIsSavingsOpen(false)}
          groupId={savingsGroup.id}
          groupName={savingsGroup.name}
        />
      )}

      {catalogGroup && (
        <ProductCatalogModal
          isOpen={isCatalogOpen}
          onClose={() => { setIsCatalogOpen(false); setSavingsRevision((value) => value + 1) }}
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
          onClose={() => { setIsListOpen(false); setSavingsRevision((value) => value + 1) }}
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
