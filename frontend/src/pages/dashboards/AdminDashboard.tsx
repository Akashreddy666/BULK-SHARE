import React, { useState, useEffect } from 'react'
import {
  Shield,
  Users,
  Store,
  Layers,
  CheckCircle,
  AlertOctagon,
  FileText,
  Activity,
  Sparkles,
  ArrowRight,
  Truck,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Package,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { BuyingGroup, GroupOrder, ProcurementOrder, OrderDispute } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface AdminDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [lockedGroups, setLockedGroups] = useState<BuyingGroup[]>([])
  const [ordersMap, setOrdersMap] = useState<Record<string, { order: GroupOrder; po?: ProcurementOrder | null }>>({})
  const [disputes, setDisputes] = useState<OrderDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<OrderDispute | null>(null)
  const [resolveStatus, setResolveStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [resolving, setResolving] = useState(false)

  const loadAdminData = async () => {
    try {
      setLoading(true)
      // 1. Load groups
      const allGroups = await api.getGroups()
      const locked = allGroups.filter((g) => g.status === 'LOCKED' || g.status === 'COMPLETED')
      setLockedGroups(locked)

      // 2. Load orders & procurement for locked groups
      const map: Record<string, { order: GroupOrder; po?: ProcurementOrder | null }> = {}
      for (const g of locked) {
        try {
          const ord = await api.getGroupOrder(g.id)
          if (ord) {
            const po = await api.getOrderProcurement(ord.id).catch(() => null)
            map[g.id] = { order: ord, po }
          }
        } catch {
          // ignore
        }
      }
      setOrdersMap(map)

      // 3. Load disputes
      const disps = await api.getAdminDisputes()
      setDisputes(disps)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handlePlaceWholesalePO = async (groupId: string, orderId: string) => {
    try {
      setActionLoading(orderId)
      const po = await api.adminPlaceProcurementOrder(orderId, {
        notes: 'Admin wholesale dispatch to supplier',
      })
      setOrdersMap((prev) => ({
        ...prev,
        [groupId]: { ...prev[groupId], po },
      }))
      alert(`Wholesale Purchase Order #${po.po_number} successfully placed with supplier!`)
    } catch (err: any) {
      alert(err?.message || 'Failed to place purchase order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenResolveModal = (disp: OrderDispute) => {
    setSelectedDispute(disp)
    setResolveStatus('RESOLVED')
    setResolutionNotes('Damaged packaging verified. Issued simulated store credit refund.')
    setRefundAmount(disp.refund_amount || 400)
  }

  const handleConfirmResolve = async () => {
    if (!selectedDispute) return
    try {
      setResolving(true)
      await api.resolveDispute(selectedDispute.id, {
        status: resolveStatus,
        resolution_notes: resolutionNotes,
        refund_amount: resolveStatus === 'RESOLVED' ? refundAmount : 0,
      })
      setSelectedDispute(null)
      loadAdminData()
    } catch (err: any) {
      alert(err?.message || 'Failed to resolve dispute')
    } finally {
      setResolving(false)
    }
  }

  const openDisputesCount = disputes.filter((d) => d.status === 'OPEN').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Platform Administrator Console</h1>
            <Badge variant="warning">
              <Shield className="w-3 h-3 mr-1" />
              Global Admin
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            System moderation, wholesale procurement placement, fulfillment oversight, and dispute resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Role Persona
          </Button>
          <Button size="sm" variant="outline" onClick={loadAdminData}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Registered Households</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">38 Users</h3>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Indiranagar & Koramangala</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Verified Wholesalers</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">3 Suppliers</h3>
              <p className="text-[11px] text-sky-600 font-medium mt-0.5">APMC & Direct Mills</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Locked Purchases</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{lockedGroups.length} Orders</h3>
              <p className="text-[11px] text-brand-600 font-medium mt-0.5">Ready for Wholesale PO</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Customer Disputes</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">{openDisputesCount} Open</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Requires admin review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Wholesale Procurement Placement (FR-PROC-01) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Wholesale Procurement Desk (FR-PROC-01)</CardTitle>
              <CardDescription className="text-xs">
                Per business rules, organizers select quotations, but Platform Admins issue the simulated purchase order (PO) to suppliers.
              </CardDescription>
            </div>
            <Badge variant="brand">Admin Authority</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 text-xs">
            {lockedGroups.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No locked group purchases awaiting procurement.
              </div>
            ) : (
              lockedGroups.map((g) => {
                const entry = ordersMap[g.id]
                const ord = entry?.order
                const po = entry?.po

                return (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{g.name}</span>
                      <Badge variant={po ? 'success' : 'warning'}>
                        {po ? `PO: ${po.status}` : 'AWAITING PO DISPATCH'}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        Total Wholesale Volume:{' '}
                        <span className="font-semibold text-slate-800">
                          {ord ? `${ord.total_packs} packs (₹${ord.total_wholesale_amount.toFixed(2)})` : 'Loading...'}
                        </span>
                      </p>
                      {po && (
                        <p className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          PO Number: {po.po_number}
                        </p>
                      )}
                    </div>

                    {!po && ord && (
                      <div className="pt-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handlePlaceWholesalePO(g.id, ord.id)}
                          disabled={actionLoading === ord.id}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1.5" />
                          {actionLoading === ord.id ? 'Dispatching...' : 'Place Wholesale PO'}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Module 2: Customer Disputes & Claims Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Customer Disputes & Claims</CardTitle>
              <CardDescription className="text-xs">
                Inspect customer damage or fulfillment tickets and issue simulated refunds.
              </CardDescription>
            </div>
            {openDisputesCount > 0 ? (
              <Badge variant="warning">{openDisputesCount} Pending</Badge>
            ) : (
              <Badge variant="success">All Resolved</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 pt-3 text-xs">
            {disputes.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No disputes reported.</div>
            ) : (
              disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{d.category.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400 ml-2">Ticket #{d.id.slice(0, 8)}</span>
                    </div>
                    <Badge variant={d.status === 'RESOLVED' ? 'success' : d.status === 'REJECTED' ? 'neutral' : 'warning'}>
                      {d.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    &ldquo;{d.description}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Reported by {d.user_name || 'Customer'}
                    </span>
                    {d.status === 'OPEN' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResolveModal(d)}
                        className="text-xs"
                      >
                        Review & Resolve
                      </Button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Refund: ₹{d.refund_amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Resolve Dispute Ticket #{selectedDispute.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDispute.category.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Decision</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="resolveStatus"
                      value="RESOLVED"
                      checked={resolveStatus === 'RESOLVED'}
                      onChange={() => setResolveStatus('RESOLVED')}
                    />
                    <span className="font-medium text-emerald-800">Approve & Settle Refund</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="resolveStatus"
                      value="REJECTED"
                      checked={resolveStatus === 'REJECTED'}
                      onChange={() => setResolveStatus('REJECTED')}
                    />
                    <span className="font-medium text-slate-700">Reject Claim</span>
                  </label>
                </div>
              </div>

              {resolveStatus === 'RESOLVED' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Simulated Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedDispute(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResolve}
                disabled={resolving}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {resolving ? 'Saving...' : 'Confirm Resolution'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
