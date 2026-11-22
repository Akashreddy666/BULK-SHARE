import { Clock, Globe, Lock, MapPin, ShoppingBag, Users } from 'lucide-react'
import type { BuyingGroup } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface GroupCardProps {
  group: BuyingGroup
  onSelect: (group: BuyingGroup) => void
  isJoining?: boolean
  onJoin?: (group: BuyingGroup) => void
  onOpenMyList?: (group: BuyingGroup) => void
}

const statuses = {
  OPEN: { label: 'Open for items', color: 'success' },
  CLOSED: { label: 'Closed to new items', color: 'neutral' },
  QUOTING: { label: 'Comparing quotes', color: 'brand' },
  CONFIRMING: { label: 'Member confirmation', color: 'warning' },
  LOCKED: { label: 'Order locked', color: 'neutral' },
  PROCUREMENT: { label: 'In procurement', color: 'info' },
  FULFILLMENT: { label: 'In fulfillment', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'danger' },
} as const

export function GroupCard({ group, onSelect, isJoining, onJoin, onOpenMyList }: GroupCardProps) {
  const isPrivate = group.visibility === 'PRIVATE'
  const VisibilityIcon = isPrivate ? Lock : Globe
  const status = statuses[group.status]
  const goal = Math.max(1, group.min_members)
  const progress = Math.min(group.members_count, goal)
  const remaining = Math.max(0, goal - group.members_count)
  const canJoin = !group.is_member && !isPrivate && group.status === 'OPEN' && !!onJoin

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="border-b-0 pb-0">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Badge variant={status.color}>{status.label}</Badge>
          <Badge variant="outline"><VisibilityIcon aria-hidden="true" className="size-3" />{isPrivate ? 'Private group' : 'Public pool'}</Badge>
          {group.is_organizer ? <Badge variant="brand">You organize</Badge> : group.is_member && <Badge variant="neutral">Joined</Badge>}
        </div>
        <CardTitle className="break-words text-xl leading-tight tracking-tight">{group.name}</CardTitle>
        {group.description && <CardDescription className="line-clamp-2">{group.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
          <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-700" />{group.neighborhood?.name || 'Local neighborhood'}</span>
          <span className="inline-flex items-center gap-1.5"><Clock aria-hidden="true" className="size-4 shrink-0 text-brand-700" />{group.status === 'OPEN' ? 'Closes' : 'Cutoff'} {formatDate(group.deadline)}</span>
        </div>

        <div className="space-y-2 rounded-xl border border-line bg-canvas p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-brand-900"><Users aria-hidden="true" className="size-4" /> Group participation</span>
            <span className="tabular-nums text-slate-700">{group.members_count} / {group.min_members} Households</span>
          </div>
          <div role="progressbar" aria-label="Household participation goal" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-brand-100">
            <div className="progress-fill h-full rounded-full bg-brand-700" style={{ width: `${100 * progress / goal}%` }} />
          </div>
          <p className="text-slate-600">{remaining === 0 ? 'Minimum threshold reached.' : `${remaining} more ${remaining === 1 ? 'household' : 'households'} to meet the group goal.`}</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 bg-white">
        <Button variant="ghost" size="sm" onClick={() => onSelect(group)}>Group details</Button>
        {group.is_member && onOpenMyList && (
          <Button size="sm" onClick={() => onOpenMyList(group)}><ShoppingBag aria-hidden="true" className="size-4" /> My grocery list</Button>
        )}
        {canJoin && <Button size="sm" variant="secondary" onClick={() => onJoin(group)} isLoading={isJoining}>Join group</Button>}
      </CardFooter>
    </Card>
  )
}
