import React, { useState } from 'react'
import {
  Users,
  Clock,
  MapPin,
  Lock,
  Globe,
  Share2,
  Copy,
  Check,
  ShoppingBag,
  LogOut,
  Sparkles,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react'
import { BuyingGroup, GroupInvitation } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface GroupDetailModalProps {
  isOpen: boolean
  onClose: () => void
  group: BuyingGroup | null
  onGroupUpdated: (group: BuyingGroup) => void
  onOpenCatalog: (group: BuyingGroup) => void
  onOpenMyList: (group: BuyingGroup) => void
  onOpenSavings?: (group: BuyingGroup) => void
  onOpenConfirmation?: (group: BuyingGroup) => void
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  group,
  onGroupUpdated,
  onOpenCatalog,
  onOpenMyList,
  onOpenSavings,
  onOpenConfirmation,
}) => {
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmLeaving, setConfirmLeaving] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!group) return null

  const isOrganizer = group.is_organizer
  const isMember = group.is_member
  const isPrivate = group.visibility === 'PRIVATE'
  const isOpenStatus = group.status === 'OPEN'

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true)
    setError(null)
    try {
      const invite = await api.createGroupInvitation(group.id, {
        expires_in_days: 7,
        max_uses: 20,
      })
      setInvitation(invite)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to generate invitation token.')
      }
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const handleCopyToken = () => {
    if (!invitation) return
    navigator.clipboard.writeText(invitation.token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => setError('Could not copy automatically. You can select and copy the displayed code.'))
  }

  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)
    try {
      const updated = await api.joinGroup(group.id)
      onGroupUpdated(updated)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to join group.')
      }
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    setIsLeaving(true)
    setError(null)
    try {
      const updated = await api.leaveGroup(group.id)
      onGroupUpdated(updated)
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to leave group.')
      }
    } finally {
      setConfirmLeaving(false)
      setIsLeaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isLeaving) { setConfirmLeaving(false); onClose() } }}
      title={group.name}
      description={`Buying group in ${group.neighborhood?.name || 'Local Neighborhood'}`}
      size="md"
    >
      <div className="space-y-4 text-sm">
        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Status and Visibility Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="success">{group.status}</Badge>
          {isPrivate ? (
            <Badge variant="neutral" className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              Private Group
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              Public Pool
            </Badge>
          )}
          {isOrganizer && <Badge variant="brand">You are the Organizer</Badge>}
          {isMember && !isOrganizer && (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
              Joined Member
            </Badge>
          )}
        </div>

        {/* Description */}
        {group.description && (
          <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            {group.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 block">Neighborhood</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              {group.neighborhood?.name} ({group.neighborhood?.postal_code})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">Order Cutoff</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {formatDate(group.deadline)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">Household Participation</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {group.members_count} / {group.min_members} Target
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">Organizer</span>
            <span className="font-semibold text-slate-900 truncate block mt-0.5">
              {group.organizer?.full_name || 'Community Member'}
            </span>
          </div>
        </div>

        {/* Organizer Section: Invite Generator */}
        {isOrganizer && (
          <div className="p-3.5 rounded-xl border border-brand-200 bg-brand-50/50 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="font-bold text-brand-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-brand-600" />
                  Invite Neighbors to Group
                </h5>
                <p className="text-[11px] text-brand-700">
                  Generate a secret code for neighbors in your apartment building or street.
                </p>
              </div>
              {!invitation && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateInvite}
                  isLoading={isGeneratingInvite}
                  className="bg-white shrink-0"
                >
                  Generate Token
                </Button>
              )}
            </div>

            {invitation && (
              <div className="pt-2 border-t border-brand-100 flex items-center justify-between gap-2">
                <code className="min-w-0 break-all text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-brand-200 text-brand-900">
                  {invitation.token}
                </code>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleCopyToken}
                  className="shrink-0 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {confirmLeaving && (
          <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-3" role="group" aria-label="Confirm leaving this group">
            <p className="text-red-900">Leaving removes your household grocery list from this group.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={isLeaving} onClick={() => setConfirmLeaving(false)}>Stay in group</Button>
              <Button size="sm" variant="danger" isLoading={isLeaving} onClick={handleLeave}>Leave and remove list</Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          {isMember && !isOrganizer && isOpenStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmLeaving(true)}
              isLoading={isLeaving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Leave Group
            </Button>
          )}

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {isMember ? (
              <>
                {group.status === 'CONFIRMING' && onOpenConfirmation && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    onClick={() => {
                      onClose()
                      onOpenConfirmation(group)
                    }}
                  >
                    Confirm order
                  </Button>
                )}
                {onOpenSavings && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => {
                      onClose()
                      onOpenSavings(group)
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    View Savings
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose()
                    onOpenCatalog(group)
                  }}
                >
                  Browse Catalog
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onClose()
                    onOpenMyList(group)
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                  My Grocery List
                </Button>
              </>
            ) : isOpenStatus && !isPrivate ? (
              <Button
                size="sm"
                onClick={handleJoin}
                isLoading={isJoining}
              >
                Join this group
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}
