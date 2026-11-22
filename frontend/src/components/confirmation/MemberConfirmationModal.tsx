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

  const deliverySurcharge = fulfillment === 'HOME_DELIVERY' ? round.home_delivery_surcharge : 0
  const finalTotal = myConfirmation && deliverySurcharge !== undefined ? myConfirmation.total_household_cost + deliverySurcharge : undefined
  const finalSavings = myConfirmation && deliverySurcharge !== undefined ? myConfirmation.total_household_savings - deliverySurcharge : undefined

  const handleAction = async (decision: MemberConfirmationStatus) => {
    if (!myConfirmation) return
    if (decision === 'ACCEPTED' && fulfillment === 'HOME_DELIVERY' && !address.trim()) {
      setError('Enter a sample address for the simulated delivery.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await api.confirmMemberAllocation(groupId, {
        status: decision,
        fulfillment_preference: fulfillment,
        delivery_address: decision === 'ACCEPTED' && fulfillment === 'HOME_DELIVERY' ? address.trim() : undefined,
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
      onClose={() => { if (!isSubmitting) onClose() }}
      title={`Review & Confirm Final Order: ${groupName}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Banner Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2">
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
          <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div role="status" className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
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

          </div>
        )}

        {!myConfirmation && <p className="rounded-xl border border-line bg-canvas p-4 text-sm">There is no proposed allocation for your household in this round.</p>}

        {!!round.household_items?.length && (
          <section aria-label="Your proposed sealed packs" className="overflow-hidden rounded-xl border border-line">
            <h3 className="bg-canvas px-4 py-3 text-sm font-bold">Your proposed sealed packs</h3>
            <ul className="divide-y divide-line">
              {round.household_items.map((item) => (
                <li key={item.variant_id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div><p className="font-semibold">{item.variant_name}</p><p className="text-slate-600">{item.pack_count} packs × {formatCurrency(item.price_per_pack)}</p></div>
                  <span className="font-bold tabular-nums">{formatCurrency(item.line_total)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <fieldset className="space-y-3" disabled={isSubmitting || !!successMsg || !myConfirmation || round.status !== 'OPEN'}>
          <legend className="text-sm font-bold text-brand-950">Pickup or delivery</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { value: 'PICKUP', label: 'Neighborhood Hub Pickup', fee: 'Free pickup', description: 'Collect your sealed packs from the designated hub.' },
              { value: 'HOME_DELIVERY', label: 'Direct Home Delivery', fee: round.home_delivery_surcharge === undefined ? 'See invoice for fee' : formatCurrency(round.home_delivery_surcharge), description: 'Simulate delivery to a sample address.' },
            ] as const).map((method) => (
              <label key={method.value} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition-colors ${fulfillment === method.value ? 'border-brand-600 bg-brand-50' : 'border-line hover:bg-canvas'}`}>
                <input type="radio" name="order-fulfillment" value={method.value} checked={fulfillment === method.value} onChange={() => setFulfillment(method.value)} className="mt-1 size-4 shrink-0 accent-brand-700" />
                <span><strong className="block">{method.label}</strong><span className="mt-1 block text-slate-700">{method.description} {method.fee}.</span></span>
              </label>
            ))}
          </div>
          {fulfillment === 'HOME_DELIVERY' && (
            <div>
              <label htmlFor="confirmation-address" className="mb-1 block text-sm font-semibold">Sample delivery address</label>
              <input id="confirmation-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Apartment, street and neighborhood" className="control w-full" />
            </div>
          )}
        </fieldset>

        {myConfirmation && (
          <dl className="space-y-2 rounded-xl border border-line bg-canvas p-4 text-sm">
            <div className="flex justify-between gap-2"><dt>Household subtotal</dt><dd className="font-semibold tabular-nums">{formatCurrency(myConfirmation.total_household_cost)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Fulfillment fee</dt><dd className="font-semibold tabular-nums">{deliverySurcharge === undefined ? 'See invoice' : formatCurrency(deliverySurcharge)}</dd></div>
            <div className="flex justify-between gap-2 border-t border-line pt-2 font-bold"><dt>Your final total</dt><dd className="tabular-nums">{finalTotal === undefined ? 'See invoice' : formatCurrency(finalTotal)}</dd></div>
            {finalSavings !== undefined && <div className="flex justify-between gap-2"><dt>Savings after fulfillment</dt><dd className="font-semibold tabular-nums">{formatCurrency(finalSavings)}</dd></div>}
          </dl>
        )}

        {/* Rejection reason box */}
        {showRejectInput && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <label htmlFor="confirmation-rejection" className="block text-sm font-bold text-red-900">Reason for rejecting quotation</label>
            <textarea
              id="confirmation-rejection"
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
              disabled={!myConfirmation || round.status !== 'OPEN' || !!successMsg}
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
