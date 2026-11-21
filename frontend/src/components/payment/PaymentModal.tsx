import React, { useState, useEffect } from 'react'
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Building,
} from 'lucide-react'
import { api } from '@/services/api'
import { HouseholdInvoice, PaymentTransaction } from '@/types'
import { Button } from '@/components/ui/Button'
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
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI')
  const [completedPayment, setCompletedPayment] = useState<PaymentTransaction | null>(null)

  useEffect(() => {
    if (isOpen && groupOrderId) {
      loadInvoice()
    }
  }, [isOpen, groupOrderId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getHouseholdInvoice(groupOrderId)
      setInvoice(data)
      if (data.payment_status === 'PAID') {
        // Already paid
        setCompletedPayment({
          id: 'existing',
          group_order_id: groupOrderId,
          user_id: data.user_id,
          amount: data.final_payable,
          currency: 'INR',
          payment_method: 'UPI',
          transaction_ref: data.transaction_ref || 'TXN-BS-PAID',
          receipt_number: data.receipt_number || 'RCP-BS-PAID',
          status: 'COMPLETED',
          paid_at: data.paid_at || new Date().toISOString(),
          created_at: data.paid_at || new Date().toISOString(),
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load household invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleSimulatePayment = async () => {
    try {
      setPaying(true)
      setError(null)
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
    } catch (err: any) {
      setError(err?.message || 'Payment simulation failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {completedPayment ? 'Settlement Receipt' : 'Order Payment & Invoice'}
              </h2>
              <p className="text-xs text-slate-500">
                {invoice?.group_name || 'Neighborhood Bulk Buying Group'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading household invoice details...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
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
                      Receipt #{completedPayment.receipt_number}
                    </h4>
                  </div>
                  <Badge variant="success">PAID</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TRANSACTION REF</span>
                    <span className="font-mono font-medium text-slate-800">
                      {completedPayment.transaction_ref}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAYMENT DATE</span>
                    <span className="font-medium text-slate-800">
                      {new Date(completedPayment.paid_at).toLocaleString()}
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
                <div className="border-t border-slate-200/80 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Saved ₹{invoice?.total_savings.toFixed(2)} vs Retail
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
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      You Save ₹{invoice?.total_savings.toFixed(2)}
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
                <div className="grid grid-cols-3 gap-3">
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
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
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
