import React, { useState, useEffect } from 'react'
import {
  Users,
  Layers,
  FileCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Plus,
  Share2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BuyingGroup } from '@/types'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { GroupDetailModal } from '@/components/groups/GroupDetailModal'
import { ProductCatalogModal } from '@/components/catalog/ProductCatalogModal'
import { HouseholdGroceryListModal } from '@/components/grocery/HouseholdGroceryListModal'

interface OrganizerDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [organizedGroups, setOrganizedGroups] = useState<BuyingGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      // Filter for groups where user is organizer
      const filtered = data.filter((g) => g.is_organizer)
      setOrganizedGroups(filtered)
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizedGroups()
  }, [])

  const handleGroupCreated = (newGroup: BuyingGroup) => {
    setOrganizedGroups((prev) => [newGroup, ...prev])
    setSelectedGroup(newGroup)
    setIsDetailOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Group Organizer Console</h1>
            <Badge variant="brand">Organizer Scope</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Welcome, <span className="font-semibold text-slate-800">{user?.full_name}</span>. Managing community bulk purchasing pools in {user?.neighborhood?.name || 'your neighborhood'}.
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

      {/* Organizer Privacy Notice (FR-LIST-04) */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Privacy-Preserving Aggregated Demand Only (FR-LIST-04)</p>
          <p className="mt-0.5 text-teal-800 leading-relaxed">
            As a neighborhood group organizer, you have administrative permission to manage group settings, generate invitation codes, and monitor aggregated grocery quantities. Individual household grocery lists and delivery addresses are kept strictly private and sealed.
          </p>
        </div>
      </div>

      {/* Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">My Organized Buying Groups</h3>
            <p className="text-xs text-slate-500">
              Groups you created or manage as neighborhood coordinator.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Another Group
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading your organized groups...
          </div>
        ) : organizedGroups.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Groups Organized Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
              <GroupCard
                key={g.id}
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
