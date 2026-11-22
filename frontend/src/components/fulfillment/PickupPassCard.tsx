import React, { useState } from 'react'
import {
  QrCode,
  PackageCheck,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react'
import { MemberFulfillment, HouseholdInvoice } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { DisputeModal } from '@/components/dispute/DisputeModal'

interface PickupPassCardProps {
  fulfillment?: MemberFulfillment | null
  groupOrderId: string
  invoice?: HouseholdInvoice | null
  onRefresh?: () => void
}

export const PickupPassCard: React.FC<PickupPassCardProps> = ({
  fulfillment,
  groupOrderId,
  invoice,
  onRefresh,
}) => {
  const [showPayModal, setShowPayModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPickup = fulfillment?.fulfillment_type === 'PICKUP' || (!fulfillment && invoice?.fulfillment_type === 'PICKUP')
  const isPaid = invoice?.payment_status === 'PAID'
  const pickupCode = fulfillment?.pickup_code || 'Pending'

  const handleCopyCode = () => {
    if (fulfillment?.pickup_code) {
      setCopyError(false)
      navigator.clipboard.writeText(fulfillment.pickup_code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => setCopyError(true))
    }
  }

  const getStatusBadge = () => {
    if (!fulfillment) {
      return <Badge variant="neutral">Procurement Pending</Badge>
    }
    switch (fulfillment.status) {
      case 'READY_FOR_PICKUP':
        return <Badge variant="success">Ready for Hub Pickup</Badge>
      case 'PICKED_UP':
        return <Badge variant="success">Picked Up & Verified</Badge>
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="warning">Out for Home Delivery</Badge>
      case 'DELIVERED':
        return <Badge variant="success">Delivered to Home</Badge>
      default:
        return <Badge variant="neutral">Awaiting Hub Arrival</Badge>
    }
  }

  return (
    <article aria-label={invoice?.group_name ? `Order for ${invoice.group_name}` : 'Household order'} className="space-y-5 rounded-panel border border-line bg-white p-4 shadow-panel sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          {invoice?.group_name && <p className="mb-1 text-sm font-semibold text-brand-800">{invoice.group_name}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              {isPickup ? 'Neighborhood Hub Pickup Pass' : 'Home Delivery Tracker'}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPickup
              ? 'Show this verification PIN to the group organizer at the local hub to claim sealed packages'
              : 'Direct doorstep delivery managed by neighborhood coordinators'}
          </p>
        </div>

        {/* Payment button if unpaid */}
        <div className="flex flex-wrap items-center gap-2">
          {!isPaid ? (
            <Button
              size="sm"
              onClick={() => setShowPayModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              Pay My Share ({invoice ? `₹${invoice.final_payable.toFixed(2)}` : 'Invoice'})
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPayModal(true)}
              className="text-xs"
            >
              View Receipt
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDisputeModal(true)}
            className="text-slate-500 hover:text-amber-700 text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Main Pass Box */}
      {isPickup ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-950 p-6 text-white shadow-lg shadow-brand-950/10">
          {/* Subtle bg circle */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">
                Customer Verification PIN
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-wider text-white">
                  {pickupCode}
                </span>
                {fulfillment?.pickup_code && (
                  <button
                    onClick={handleCopyCode}
                    className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-brand-200">
                Example pickup hub · Indiranagar Community Hall, 12th Main Road
              </p>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 flex items-center gap-3 max-w-xs">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div className="text-[11px] text-brand-100 leading-tight">
                <span className="font-semibold text-white block mb-0.5">Physical Package Handover</span>
                The hub coordinator enters this code to confirm and release your items.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Home Delivery Track */
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-xs text-slate-900">Doorstep Drop Scheduled</h4>
                <span className="text-xs font-semibold text-sky-700">
                  {fulfillment?.status === 'DELIVERED' ? 'Delivered' : fulfillment?.status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : 'Awaiting dispatch'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{fulfillment?.delivery_address || 'Address on record'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {copyError && <p role="alert" className="text-sm text-red-800">Could not copy the code. Select and copy the displayed PIN.</p>}
      {/* Modals */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        groupOrderId={groupOrderId}
        onPaymentSuccess={onRefresh}
      />

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        groupOrderId={groupOrderId}
        onDisputeSubmitted={onRefresh}
      />
    </article>
  )
}
