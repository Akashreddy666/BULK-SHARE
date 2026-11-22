import React, { useState, useEffect } from 'react'
import {
  Scan,
  CheckCircle2,
  Package,
  Truck,
  User,
  Phone,
  Search,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react'
import { api } from '@/services/api'
import { MemberFulfillment, FulfillmentStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface HubPickupDeskProps {
  groupOrderId: string
  groupName?: string
}

export const HubPickupDesk: React.FC<HubPickupDeskProps> = ({ groupOrderId, groupName }) => {
  const [fulfillments, setFulfillments] = useState<MemberFulfillment[]>([])
  const [loading, setLoading] = useState(true)
  const [inputCode, setInputCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadFulfillments = async () => {
    try {
      setLoading(true)
      const data = await api.getOrderFulfillments(groupOrderId)
      setFulfillments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (groupOrderId) {
      loadFulfillments()
    }
  }, [groupOrderId])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputCode.trim()) return

    try {
      setVerifying(true)
      setVerifyMessage(null)
      const res = await api.verifyPickupCode(groupOrderId, inputCode.trim())
      setVerifyMessage({
        type: 'success',
        text: `Success! Handed over goods to ${res.user_name || 'Customer'}. (Code ${res.pickup_code} verified)`,
      })
      setInputCode('')
      loadFulfillments()
    } catch (err: any) {
      setVerifyMessage({
        type: 'error',
        text: err?.message || 'Verification failed. Please check the code and try again.',
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleMarkDelivered = async (fulId: string) => {
    try {
      await api.updateDeliveryStatus(groupOrderId, fulId, {
        status: 'DELIVERED',
        notes: 'Doorstep drop completed by coordinator',
      })
      loadFulfillments()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = fulfillments.filter(
    (f) =>
      f.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pickedUpCount = fulfillments.filter((f) => f.status === 'PICKED_UP' || f.status === 'DELIVERED').length

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Neighborhood Hub Distribution Desk
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify customer PINs at collection and manage doorstep deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            {pickedUpCount} of {fulfillments.length} Handed Over
          </Badge>
          <Button variant="outline" size="sm" onClick={loadFulfillments} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Code Verification Box */}
      <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-3">
        <div className="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-wider">
          <Scan className="w-4 h-4 text-brand-600" />
          Scan / Enter Customer Verification Code
        </div>

        <form onSubmit={handleVerifyCode} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="e.g. BS-4829"
            className="flex-1 px-4 py-2 text-sm font-mono uppercase font-bold rounded-xl border border-brand-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
          />
          <Button
            type="submit"
            disabled={verifying || !inputCode.trim()}
            className="bg-brand-600 hover:bg-brand-700 text-white shrink-0"
          >
            {verifying ? 'Verifying...' : 'Verify & Handover'}
          </Button>
        </form>

        {verifyMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              verifyMessage.type === 'success'
                ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                : 'bg-rose-100/80 text-rose-900 border border-rose-200'
            }`}
          >
            {verifyMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{verifyMessage.text}</span>
          </div>
        )}
      </div>

      {/* Roster & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Household Allocation Roster ({fulfillments.length})
          </h4>
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search fulfillment by member name"
              placeholder="Search by member name"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-brand-500"
            />
          </div>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching member fulfillment records
            </div>
          ) : (
            filtered.map((f) => (
              <div
                key={f.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{f.user_name || 'Member'}</span>

                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    {f.fulfillment_type === 'PICKUP' ? (
                      <>
                        <Package className="w-3 h-3 text-brand-600" />
                        <span>Self Pickup at Hub</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3 h-3 text-sky-600" />
                        <span>Home delivery</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.status === 'PICKED_UP' || f.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : f.status === 'READY_FOR_PICKUP'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {f.status.replace(/_/g, ' ')}
                  </span>

                  {f.fulfillment_type === 'HOME_DELIVERY' && f.status !== 'DELIVERED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkDelivered(f.id)}
                      className="text-[11px] py-1 h-7"
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
