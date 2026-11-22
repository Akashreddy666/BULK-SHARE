import React, { useState } from 'react'
import { ConfirmationRound } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'

interface ConfirmationRoundPanelProps {
  round: ConfirmationRound | null
  isLoading: boolean
  isOrganizer: boolean
  onLockOrder?: () => Promise<void>
  onRecalculate?: () => Promise<void>
}

export const ConfirmationRoundPanel: React.FC<ConfirmationRoundPanelProps> = ({
  round,
  isLoading,
  isOrganizer,
  onLockOrder,
  onRecalculate,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-stone-200 animate-pulse">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-stone-600 text-sm">Loading member confirmation progress...</p>
      </div>
    )
  }

  if (!round) {
    return (
      <Card className="p-8 text-center bg-stone-50 border border-stone-200">
        <h4 className="text-base font-bold text-stone-900">No Active Confirmation Round</h4>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Once you select a wholesale supplier quotation from the Quotations tab, a member confirmation round will automatically open here for household review.
        </p>
      </Card>
    )
  }

  const hasRejections = round.rejected_count > 0
  const isRound1 = round.round_number === 1
  const allConfirmed = round.confirmed_count === round.total_members && round.total_members > 0
  const progressPercent = round.total_members > 0 ? Math.round((round.confirmed_count / round.total_members) * 100) : 0

  const handleLock = async () => {
    if (!onLockOrder) return
    setIsActionLoading(true)
    setActionError(null)
    try {
      await onLockOrder()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to lock order')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRecalc = async () => {
    if (!onRecalculate) return
    setIsActionLoading(true)
    setActionError(null)
    try {
      await onRecalculate()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to trigger recalculation')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stat Callout */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900">
                Confirmation Round {round.round_number} ({round.status})
              </h3>
              <Badge variant={round.status === 'COMPLETED' ? 'success' : round.status === 'OPEN' ? 'warning' : 'neutral'}>
                {round.status}
              </Badge>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Selected Supplier: <span className="font-semibold text-stone-800">{round.selected_quotation?.supplier_name || 'Wholesaler'}</span>
              {' • '}
              Deadline: <span className="font-semibold text-stone-800">{formatDate(round.deadline)}</span>
            </p>
          </div>

          {/* Organizer Lock / Recalculate Actions */}
          {isOrganizer && round.status === 'OPEN' && (
            <div className="flex flex-wrap items-center gap-2">
              {hasRejections && isRound1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
                  onClick={handleRecalc}
                  disabled={isActionLoading}
                >
                  Recalculate Order (Round 2)
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleLock}
                disabled={isActionLoading || round.confirmed_count === 0}
              >
                {allConfirmed ? '✓ Lock Group Order' : 'Lock Confirmed Order'}
              </Button>
            </div>
          )}
        </div>

        {actionError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {actionError}
          </div>
        )}

        {/* Progress Bar & KPI Cards */}
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-stone-600">
            <span>Member Approval Progress</span>
            <span>
              {round.confirmed_count} of {round.total_members} members approved ({progressPercent}%)
            </span>
          </div>
          <div role="progressbar" aria-label="Member approval progress" aria-valuenow={progressPercent} className="h-3 w-full overflow-hidden rounded-full bg-brand-100">
            <div
              className="progress-fill h-3 rounded-full bg-brand-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-2 pt-2 text-center sm:grid-cols-3">
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Confirmed (Accepted)</span>
            <span className="text-xl font-bold text-emerald-900 block mt-0.5">{round.confirmed_count}</span>
          </div>
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase">Awaiting (Pending)</span>
            <span className="text-xl font-bold text-amber-900 block mt-0.5">{round.pending_count}</span>
          </div>
          <div className="bg-red-50/70 p-3 rounded-xl border border-red-100">
            <span className="text-[11px] font-semibold text-red-800 uppercase">Rejected</span>
            <span className="text-xl font-bold text-red-900 block mt-0.5">{round.rejected_count}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
