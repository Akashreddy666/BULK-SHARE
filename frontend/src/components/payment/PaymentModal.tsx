import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  TrendingDown,
  Building,
} from 'lucide-react'
import { api } from '@/services/api'
import { HouseholdInvoice } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  groupOrderId: string
  onPaymentSuccess?: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  groupOrderId,
  onPaymentSuccess,
}) => {
  const [invoice, setInvoice] = useState<HouseholdInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI')
  const [completedPayment, setCompletedPayment] = useState<{
    amount: number
    transaction_ref?: string | null
    receipt_number?: string | null
    paid_at?: string | null
  } | null>(null)

  useEffect(() => {
    if (isOpen && groupOrderId) {
      loadInvoice()
    }
  }, [isOpen, groupOrderId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      setPaymentError('')
      setCompletedPayment(null)
      const data = await api.getHouseholdInvoice(groupOrderId)
      setInvoice(data)
      if (data.payment_status === 'PAID') {
        // Already paid
        setCompletedPayment({
          amount: data.final_payable,
          transaction_ref: data.transaction_ref,
          receipt_number: data.receipt_number,
          paid_at: data.paid_at,
        })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load household invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleSimulatePayment = async () => {
    try {
      setPaying(true)
      setPaymentError('')
      const res = await api.simulatePayment(groupOrderId, {
        payment_method: paymentMethod,
        notes: `Simulated settlement via ${paymentMethod}`,
      })
      setCompletedPayment(res)
      if (invoice) {
        setInvoice({
          ...invoice,
          payment_status: 'PAID',
          receipt_number: res.receipt_number,
          transaction_ref: res.transaction_ref,
          paid_at: res.paid_at,
        })
      }
      if (onPaymentSuccess) {
        onPaymentSuccess()
      }
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Payment simulation failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const savings = invoice ? formatCurrency(invoice.subtotal_retail - invoice.final_payable) : 'Unavailable'

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!paying) onClose() }} title={completedPayment ? 'Settlement Receipt' : 'Order Payment & Invoice'} description={invoice?.group_name || 'Household order'} size="lg">
      <div className="space-y-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading household invoice details...
            </div>
          ) : error ? (
            <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadInvoice}>Try again</Button>
            </div>
          ) : completedPayment ? (
            /* PAID RECEIPT VIEW */
            <div className="space-y-6">
              <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">Payment Settled Successfully!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your household share has been funded. The order will be procured from the wholesaler.
                </p>
              </div>

              {/* Receipt Card */}
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Official Tax Invoice
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {completedPayment.receipt_number ? `Receipt #${completedPayment.receipt_number}` : 'Payment received'}
                    </h4>
                  </div>
                  <Badge variant="success">PAID</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TRANSACTION REF</span>
                    <span className="font-mono font-medium text-slate-800">
                      {completedPayment.transaction_ref ?? 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAYMENT DATE</span>
                    <span className="font-medium text-slate-800">
                      {completedPayment.paid_at ? new Date(completedPayment.paid_at).toLocaleString() : 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAID BY</span>
                    <span className="font-medium text-slate-800">{invoice?.user_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">FULFILLMENT</span>
                    <span className="font-medium text-slate-800">{invoice?.fulfillment_type}</span>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="border-t border-slate-200/80 pt-3">
                  <p className="text-[11px] font-semibold text-slate-700 mb-2">Itemized Household Sacks</p>
                  <div className="space-y-1.5 text-xs">
                    {invoice?.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>
                          {it.quantity}x {it.product_name} ({it.variant_brand} {it.package_size}{it.unit})
                        </span>
                        <span className="font-medium">₹{it.wholesale_total.toFixed(2)}</span>
                      </div>
                    ))}
                    {invoice && invoice.delivery_surcharge > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Home Delivery Surcharge</span>
                        <span className="font-medium">₹{invoice.delivery_surcharge.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total & Savings summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <div>
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Savings vs. sample retail {savings}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">TOTAL SETTLED</span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{completedPayment.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Receipt
                </Button>
                <Button size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* UNPAID INVOICE & SIMULATED GATEWAY */
            <div className="space-y-6">
              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Household Allocation ({invoice?.items.length} SKUs)
                  </h4>
                  <span className="text-xs text-brand-700 font-semibold">
                    Wholesale Bulk Rates Applied
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {invoice?.items.map((it, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div>
                        <p className="font-semibold text-slate-900">{it.product_name}</p>
                        <p className="text-slate-500 text-[11px]">
                          {it.variant_brand} • {it.package_size} {it.unit} sealed pack × {it.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">₹{it.wholesale_total.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 line-through">
                          ₹{it.retail_total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Surcharge & Total */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Retail Store Equivalent</span>
                    <span className="line-through">₹{invoice?.subtotal_retail.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Wholesale Group Rate</span>
                    <span className="font-semibold text-slate-900">
                      ₹{invoice?.subtotal_wholesale.toFixed(2)}
                    </span>
                  </div>
                  {invoice && invoice.delivery_surcharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Home Delivery Surcharge</span>
                      <span className="font-medium text-slate-900">
                        +₹{invoice.delivery_surcharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-2 text-sm font-bold text-ink">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      Savings vs. sample retail {savings}
                    </span>
                    <span>Total Payable: ₹{invoice?.final_payable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Simulated Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'UPI'
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-brand-600 mb-2" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900">UPI Instant</p>
                      <p className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'CARD'
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600 mb-2" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900">Cards</p>
                      <p className="text-[10px] text-slate-500">Credit or Debit</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NET_BANKING')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'NET_BANKING'
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building className="w-5 h-5 text-sky-600 mb-2" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900">Net Banking</p>
                      <p className="text-[10px] text-slate-500">All major banks</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Simulated Demo Transaction: No real bank cards or accounts are billed. Immediate receipt generated.
                </span>
              </div>

              {paymentError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{paymentError}</p>}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose} disabled={paying}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSimulatePayment}
                  disabled={paying}
                  className="bg-brand-600 hover:bg-brand-700 text-white min-w-40"
                >
                  {paying ? (
                    'Processing Settlement...'
                  ) : (
                    <>
                      Pay ₹{invoice?.final_payable.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
      </div>
    </Modal>
  )
}
