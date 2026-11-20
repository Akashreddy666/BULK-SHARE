import React, { useState } from 'react'
import { ConfirmationRound, MemberConfirmation, FulfillmentPreference, MemberConfirmationStatus } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface MemberConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  round: ConfirmationRound | null
  myConfirmation?: MemberConfirmation | null
  onConfirmed?: () => void
}

export const MemberConfirmationModal: React.FC<MemberConfirmationModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  round,
  myConfirmation,
  onConfirmed,
}) => {
  const [fulfillment, setFulfillment] = useState<FulfillmentPreference>(
    myConfirmation?.fulfillment_preference || 'PICKUP'
  )
  const [address, setAddress] = useState(myConfirmation?.delivery_address || '')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!round) return null

  const handleAction = async (decision: MemberConfirmationStatus) => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await api.confirmMemberAllocation(groupId, {
        status: decision,
        fulfillment_preference: fulfillment,
        delivery_address: fulfillment === 'HOME_DELIVERY' ? address : undefined,
        rejection_reason: decision === 'REJECTED' ? rejectionReason : undefined,
      })

      setSuccessMsg(
        decision === 'ACCEPTED'
          ? 'Household allocation confirmed successfully!'
          : 'Quotation rejected. Organizer will be notified for order recalculation.'
      )
      onConfirmed?.()
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit confirmation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isAlreadyConfirmed = myConfirmation?.status === 'ACCEPTED'
  const isAlreadyRejected = myConfirmation?.status === 'REJECTED'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review & Confirm Final Order: ${groupName}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Banner Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 text-sm">
                Round {round.round_number} Confirmation
              </span>
              <Badge variant="brand">
                {round.round_number === 1 ? 'Initial Approval' : 'Final Recalculated Round'}
              </Badge>
            </div>
            <p className="text-emerald-800 mt-1">
              Selected Supplier: <strong>{round.selected_quotation?.supplier_name || 'Verified Wholesaler'}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-emerald-700 block font-medium">Confirmation Deadline</span>
            <strong className="text-emerald-950 font-bold">{formatDate(round.deadline)}</strong>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Current status if already submitted */}
        {(isAlreadyConfirmed || isAlreadyRejected) && (
          <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            isAlreadyConfirmed ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
          }`}>
            <span>
              Your current status: <strong>{myConfirmation?.status}</strong> on{' '}
              {myConfirmation?.confirmed_at ? formatDate(myConfirmation.confirmed_at) : 'recently'}
            </span>
            <span className="text-[11px] font-normal underline cursor-pointer" onClick={() => setShowRejectInput(false)}>
              Change Selection
            </span>
          </div>
        )}

        {/* Cost & Savings Summary Box */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-xs text-stone-500 font-medium block">Your Final Household Cost</span>
            <span className="text-2xl font-black text-stone-900 mt-0.5 block">
              {formatCurrency(myConfirmation?.total_household_cost || 0)}
            </span>
            <span className="text-[11px] text-stone-500">at selected wholesale rate</span>
          </div>
          <div>
            <span className="text-xs text-emerald-700 font-medium block">Your Net Bulk Savings</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
              {formatCurrency(myConfirmation?.total_household_savings || 0)}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">vs supermarket MRP</span>
          </div>
        </div>

        {/* Fulfillment Preference Radio Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-900 block">Select Delivery / Pickup Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                fulfillment === 'PICKUP'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
              onClick={() => setFulfillment('PICKUP')}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">Neighborhood Hub Pickup</span>
                <span className="text-[11px] font-semibold text-emerald-700">FREE</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Collect your sealed bags from the designated society coordinator hub.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                fulfillment === 'HOME_DELIVERY'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
              onClick={() => setFulfillment('HOME_DELIVERY')}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">Direct Home Delivery</span>
                <span className="text-[11px] font-semibold text-stone-600">+ Nominal</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Delivered right to your doorstep upon order arrival.
              </p>
            </div>
          </div>

          {fulfillment === 'HOME_DELIVERY' && (
            <div className="mt-2 space-y-1">
              <label className="text-[11px] font-semibold text-stone-700">Doorstep Delivery Address</label>
              <input
                type="text"
                placeholder="Apartment #, Wing, Street, Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-stone-400">Kept private and sealed — visible only for final fulfillment delivery.</p>
            </div>
          )}
        </div>

        {/* Rejection reason box */}
        {showRejectInput && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <label className="text-xs font-bold text-red-900 block">Reason for Rejecting Quotation</label>
            <textarea
              rows={2}
              placeholder="e.g. Quoted rate is higher than local retail deal, or brand preference changed."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 text-xs border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[11px] text-red-700">
              Note: Rejecting will trigger an order recalculation round (Round 2). If Round 2 fails, the community purchase cancels.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {!showRejectInput ? (
            <button
              type="button"
              className="text-xs text-red-600 hover:text-red-700 font-medium"
              onClick={() => setShowRejectInput(true)}
            >
              Have concerns? Reject this quotation
            </button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 border-red-300 hover:bg-red-50"
              onClick={() => handleAction('REJECTED')}
              isLoading={isSubmitting}
            >
              Confirm Rejection
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction('ACCEPTED')}
              isLoading={isSubmitting}
            >
              Accept & Confirm Order
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
