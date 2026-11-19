import React from 'react'
import {
  Users,
  Clock,
  MapPin,
  Lock,
  Globe,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import { BuyingGroup } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface GroupCardProps {
  group: BuyingGroup
  onSelect: (group: BuyingGroup) => void
  onJoin?: (group: BuyingGroup) => void
  onOpenMyList?: (group: BuyingGroup) => void
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onSelect,
  onJoin,
  onOpenMyList,
}) => {
  const isOrganizer = group.is_organizer
  const isMember = group.is_member
  const isPrivate = group.visibility === 'PRIVATE'
  const progressPercent = Math.min(100, Math.round((group.members_count / group.min_members) * 100))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success">OPEN FOR ITEMS</Badge>
      case 'QUOTING':
        return <Badge variant="brand">COMPARING QUOTES</Badge>
      case 'CONFIRMING':
        return <Badge variant="warning">MEMBER CONFIRMATION</Badge>
      case 'LOCKED':
        return <Badge variant="neutral">ORDER LOCKED</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <Card className="hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs hover:shadow-md">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {getStatusBadge(group.status)}
                {isPrivate ? (
                  <Badge variant="neutral" className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Private Group
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Globe className="w-3 h-3 text-slate-400" />
                    Public Pool
                  </Badge>
                )}
                {isOrganizer && (
                  <Badge variant="brand" className="text-[10px]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    You Organize
                  </Badge>
                )}
                {isMember && !isOrganizer && (
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Joined Member
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base text-slate-900 line-clamp-1">{group.name}</CardTitle>
              {group.description && (
                <CardDescription className="text-xs text-slate-500 line-clamp-2">
                  {group.description}
                </CardDescription>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {group.members_count}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="truncate">{group.neighborhood?.name || 'Local Neighborhood'}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Closes {formatDate(group.deadline)}</span>
            </div>
          </div>

          {/* Member Threshold Progress */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-600">
              <span>Wholesale Activation Goal</span>
              <span className="font-semibold text-slate-900">
                {group.members_count} / {group.min_members} Households
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  progressPercent >= 100 ? 'bg-emerald-600' : 'bg-brand-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              {group.members_count >= group.min_members
                ? '✓ Minimum threshold reached — wholesale quotations will be solicited.'
                : `${group.min_members - group.members_count} more household(s) needed to unlock bulk pricing.`}
            </p>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={() => onSelect(group)}>
          Group Details
        </Button>

        {isMember ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenMyList?.(group)}
            className="flex items-center gap-1.5"
          >
            My Grocery List
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onJoin?.(group)}
            className="border-brand-600 text-brand-700 hover:bg-brand-50"
          >
            Join Group
          </Button>
        )}
      </div>
    </Card>
  )
}
