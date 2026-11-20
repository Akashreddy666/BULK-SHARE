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
  TrendingDown,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BuyingGroup, DemandSummaryResponse, SupplierQuotation } from '@/types'
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

interface OrganizerDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [organizedGroups, setOrganizedGroups] = useState<BuyingGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'groups' | 'demand' | 'quotations'>('groups')
  const [isLoading, setIsLoading] = useState(true)

  // Demand aggregation & quotations state for active group
  const [demandSummary, setDemandSummary] = useState<DemandSummaryResponse | null>(null)
  const [isDemandLoading, setIsDemandLoading] = useState(false)
  const [demandError, setDemandError] = useState<string | null>(null)

  const [quotations, setQuotations] = useState<SupplierQuotation[]>([])
  const [isQuotesLoading, setIsQuotesLoading] = useState(false)

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

  // Load demand summary and quotations whenever activeGroupId or activeTab changes
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
    // Reload demand summary and switch to quotations tab
    const updatedSummary = await api.getDemandSummary(activeGroupId)
    setDemandSummary(updatedSummary)
    // Update local group status to QUOTING
    setOrganizedGroups((prev) =>
      prev.map((g) => (g.id === activeGroupId ? { ...g, status: 'QUOTING' } : g))
    )
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

          <div className="flex items-center gap-1.5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'demand'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Pooled Demand & Tiers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quotations')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'quotations'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Wholesale Quotations
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
                Compare bids from verified distributors to pick the optimal supplier for group procurement.
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
            onSelectQuotation={(quote) => {
              alert(`Selected quotation from ${quote.supplier_name} for ${quote.total_quoted_price}. Member confirmation round will start in Milestone 4!`)
            }}
          />
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
