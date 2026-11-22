import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CircleDollarSign, FileText, Layers, RefreshCw, ShieldCheck, Store, Truck, Users } from 'lucide-react'
import { Dashboard, DashboardHeader, DashboardNav, Metric, PanelError, PanelLoading } from '@/components/dashboard/Dashboard'
import { ActionDialog, type PendingAction } from '@/components/ui/ActionDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@/services/api'
import type { BuyingGroup, GroupOrder, GroupOrderPaymentSummary, MemberFulfillment, OrderDispute, ProcurementOrder, SupplierProfile, SupplierQuotation } from '@/types'

const sections = [
  { id: 'orders', label: 'Procurement & payments', icon: Truck },
  { id: 'groups', label: 'Buying groups', icon: Users },
  { id: 'suppliers', label: 'Suppliers', icon: Store },
  { id: 'disputes', label: 'Disputes', icon: AlertCircle },
] as const

const orderedStatuses = ['LOCKED', 'PROCUREMENT', 'FULFILLMENT', 'COMPLETED']
const pendingDispute = (dispute: OrderDispute) => ['OPEN', 'UNDER_REVIEW'].includes(dispute.status)
const statusLabel = (value: string) => value.toLowerCase().replace(/_/g, ' ')

interface OrderRecord {
  group: BuyingGroup
  order: GroupOrder
  procurement: ProcurementOrder | null
  payment: GroupOrderPaymentSummary
  fulfillments: MemberFulfillment[]
}

export function AdminDashboard() {
  const notify = useToast()
  const [tab, setTab] = useState<typeof sections[number]['id']>('orders')
  const [groups, setGroups] = useState<BuyingGroup[]>([])
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [disputes, setDisputes] = useState<OrderDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [action, setAction] = useState<PendingAction | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<OrderDispute | null>(null)
  const [quoteGroup, setQuoteGroup] = useState<BuyingGroup | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const selectedOrder = orders.find(({ order }) => order.id === selectedOrderId)

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const [allGroups, allSuppliers, allDisputes] = await Promise.all([api.getGroups(), api.getSuppliers(), api.getAdminDisputes()])
      const records = await Promise.all(allGroups.filter((group) => orderedStatuses.includes(group.status)).map(async (group) => {
        const order = await api.getGroupOrder(group.id)
        if (!order) return null
        const [procurement, payment, fulfillments] = await Promise.all([
          api.getOrderProcurement(order.id),
          api.getPaymentSummary(order.id),
          api.getOrderFulfillments(order.id),
        ])
        return { group, order, procurement, payment, fulfillments }
      }))
      setGroups(allGroups)
      setSuppliers(allSuppliers)
      setDisputes(allDisputes)
      setOrders(records.filter((record) => record !== null))
    } catch {
      setLoadError('The operations workspace could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function prepareProcurement(record: OrderRecord) {
    setAction({
      title: 'Issue a simulated purchase order?',
      description: `Create a demo purchase order for ${record.group.name}. This sends no live order to a supplier.`,
      label: 'Issue purchase order',
      run: async () => {
        const procurement = await api.adminPlaceProcurementOrder(record.order.id, { notes: 'Simulated procurement initiated by administrator.' })
        setOrders((previous) => previous.map((entry) => entry.order.id === record.order.id ? { ...entry, procurement } : entry))
        notify(`Simulated purchase order ${procurement.po_number} issued.`)
      },
    })
  }

  const openDisputes = disputes.filter(pendingDispute).length
  const totalsAvailable = !loading && !loadError

  return (
    <Dashboard>
      <DashboardHeader role="Platform administrator" title="Operations console" description="Review group activity, supplier verification status, simulated purchases and customer disputes." icon={ShieldCheck}>
        <Button variant="outline" onClick={load} isLoading={loading}><RefreshCw aria-hidden="true" className="size-4" /> Refresh records</Button>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Buying groups" value={totalsAvailable ? groups.length : '—'} icon={Users} />
        <Metric label="Verified suppliers" value={totalsAvailable ? suppliers.filter((supplier) => supplier.is_verified).length : '—'} icon={Store} />
        <Metric label="Locked purchases" value={totalsAvailable ? orders.length : '—'} icon={Layers} />
        <Metric label="Open disputes" value={totalsAvailable ? openDisputes : '—'} icon={AlertCircle} />
      </div>

      <div className="rounded-panel border border-line bg-white p-3">
        <DashboardNav label="Operations views" items={sections} value={tab} onChange={setTab} />
      </div>

      {loadError && <PanelError message={loadError} onRetry={load} />}
      {loading && <PanelLoading label="Loading operations records" />}

      {totalsAvailable && tab === 'orders' && (
        <Card>
          <CardHeader><CardTitle>Procurement &amp; simulated payments</CardTitle><CardDescription>Track collection, issue a purchase order and follow fulfillment.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {orders.length === 0 && <p className="text-sm text-slate-600">Locked group purchases will appear here.</p>}
            {orders.map((record) => (
              <article key={record.order.id} className="min-w-0 space-y-3 rounded-xl border border-line bg-canvas p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold text-brand-950">{record.group.name}</h3>
                  <Badge variant={record.procurement ? 'success' : 'warning'}>{record.procurement ? statusLabel(record.procurement.status) : 'Purchase order pending'}</Badge>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-slate-600">Wholesale total</dt><dd className="font-bold tabular-nums">{formatCurrency(record.order.total_wholesale_amount)}</dd></div>
                  <div><dt className="text-slate-600">Simulated payments collected</dt><dd className="font-bold tabular-nums">{formatCurrency(record.payment.total_collected)} · {record.payment.paid_members_count}/{record.payment.total_members} households</dd></div>
                </dl>
                {record.procurement && <p className="text-sm text-slate-700">Purchase order {record.procurement.po_number}</p>}
                <div className="flex flex-wrap gap-2">
                  {!record.procurement && <Button size="sm" onClick={() => prepareProcurement(record)}>Place wholesale PO</Button>}
                  <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(record.order.id)}>Track fulfillment</Button>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      )}

      {totalsAvailable && tab === 'groups' && (
        <Card>
          <CardHeader><CardTitle>Buying group activity</CardTitle><CardDescription>Monitor group status and review supplier quotations.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {groups.length === 0 && <p className="text-sm text-slate-600">No buying groups have been created.</p>}
            {groups.map((group) => (
              <div key={group.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4 text-sm">
                <div><p className="font-bold">{group.name}</p><p className="mt-1 text-slate-600">{group.neighborhood?.name || 'Neighborhood group'} · {group.members_count} households · Closes {formatDate(group.deadline)}</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={group.status === 'OPEN' ? 'success' : 'neutral'}>{statusLabel(group.status)}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setQuoteGroup(group)}><FileText aria-hidden="true" className="size-4" /> Review quotes</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalsAvailable && tab === 'suppliers' && (
        <Card>
          <CardHeader><CardTitle>Supplier directory</CardTitle><CardDescription>Review business profiles and the verification status on record.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {suppliers.length === 0 && <p className="text-sm text-slate-600">No supplier profiles are available.</p>}
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-line p-4 text-sm">
                <div className="min-w-0"><p className="break-words font-bold">{supplier.company_name}</p><p className="mt-1 text-slate-600">{supplier.city}</p>{supplier.description && <p className="mt-1 break-words text-slate-700">{supplier.description}</p>}</div>
                <Badge variant={supplier.is_verified ? 'success' : 'warning'}>{supplier.is_verified ? 'Verified in the demo' : 'Verification pending'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalsAvailable && tab === 'disputes' && (
        <Card>
          <CardHeader><CardTitle>Customer disputes</CardTitle><CardDescription>Review issues and record refund decisions in the simulation.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {disputes.length === 0 && <p className="text-sm text-slate-600">No disputes have been reported.</p>}
            {disputes.map((dispute) => (
              <article key={dispute.id} className="space-y-3 rounded-xl border border-line p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="font-bold capitalize">{statusLabel(dispute.category)}</h3><p className="mt-1 text-slate-600">Ticket {dispute.id.slice(0, 8)} · {formatDate(dispute.created_at)}</p></div>
                  <Badge variant={pendingDispute(dispute) ? 'warning' : 'neutral'}>{statusLabel(dispute.status)}</Badge>
                </div>
                <p className="break-words rounded-lg bg-canvas p-3 text-slate-700">{dispute.description}</p>
                {pendingDispute(dispute) ? <Button size="sm" variant="outline" onClick={() => setSelectedDispute(dispute)}>Review dispute</Button> : <p className="text-slate-700">Simulated refund {formatCurrency(dispute.refund_amount)}</p>}
              </article>
            ))}
          </CardContent>
        </Card>
      )}

      <ActionDialog action={action} onClose={() => setAction(null)} />
      {quoteGroup && <AdminQuotes group={quoteGroup} onClose={() => setQuoteGroup(null)} />}
      {selectedOrder && (
        <AdminFulfillment record={selectedOrder} onClose={() => setSelectedOrderId(null)} onUpdate={(updated) => {
          setOrders((previous) => previous.map((entry) => entry.order.id === selectedOrder.order.id ? { ...entry, fulfillments: entry.fulfillments.map((item) => item.id === updated.id ? { ...item, ...updated, user_name: item.user_name } : item) } : entry))
        }} />
      )}
      {selectedDispute && (
        <ResolveDispute dispute={selectedDispute} onClose={() => setSelectedDispute(null)} onResolve={(updated) => {
          setDisputes((previous) => previous.map((item) => item.id === updated.id ? updated : item))
          setSelectedDispute(null)
          notify('Dispute decision saved.')
        }} />
      )}
    </Dashboard>
  )
}

function AdminQuotes({ group, onClose }: { group: BuyingGroup; onClose: () => void }) {
  const [quotes, setQuotes] = useState<SupplierQuotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    api.getGroupQuotations(group.id)
      .then((results) => { if (current) setQuotes(results) })
      .catch(() => { if (current) setError('Supplier quotations could not be loaded.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [group.id])

  return (
    <Modal isOpen title="Group quotations" description={group.name} onClose={onClose}>
      {loading ? <PanelLoading label="Loading quotations" count={1} /> : error ? <PanelError message={error} /> : quotes.length ? (
        <ul className="space-y-2">
          {quotes.map((quote) => (
            <li key={quote.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3 text-sm">
              <div><p className="font-bold">{quote.supplier_name ?? 'Supplier'}</p><p className="text-slate-600">Valid through {formatDate(quote.valid_until)}</p></div>
              <div className="flex flex-wrap items-center gap-2"><strong>{formatCurrency(quote.total_quoted_price)}</strong><Badge variant="neutral">{statusLabel(quote.status)}</Badge></div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-600">This group has no recorded quotations.</p>}
    </Modal>
  )
}

function AdminFulfillment({ record, onClose, onUpdate }: { record: OrderRecord; onClose: () => void; onUpdate: (entry: MemberFulfillment) => void }) {
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  async function update(entry: MemberFulfillment, status: string) {
    setSavingId(entry.id)
    setError('')
    try {
      onUpdate(await api.updateDeliveryStatus(record.order.id, entry.id, { status }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update delivery.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Modal isOpen title="Fulfillment tracking" description={record.group.name} size="lg" onClose={() => { if (!savingId) onClose() }}>
      <div className="space-y-3">
        {error && <PanelError message={error} />}
        {record.fulfillments.length === 0 && <p className="text-sm text-slate-600">Household fulfillment records are created during simulated procurement.</p>}
        {record.fulfillments.map((entry) => (
          <div key={entry.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-3 text-sm">
            <div><p className="font-bold">{entry.user_name ?? 'Household'}</p><p className="mt-1 capitalize text-slate-600">{statusLabel(entry.fulfillment_type)}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{statusLabel(entry.status)}</Badge>
              {entry.fulfillment_type === 'HOME_DELIVERY' && entry.status === 'OUT_FOR_DELIVERY' && (
                <Button size="sm" variant="outline" isLoading={savingId === entry.id} disabled={!!savingId} onClick={() => update(entry, 'DELIVERED')}>Mark delivered</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function ResolveDispute({ dispute, onClose, onResolve }: { dispute: OrderDispute; onClose: () => void; onResolve: (updated: OrderDispute) => void }) {
  const [decision, setDecision] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const notes = String(data.get('notes')).trim()
    if (!notes) {
      setError('Add a note explaining the dispute decision.')
      return
    }
    setError('')
    setBusy(true)
    try {
      onResolve(await api.resolveDispute(dispute.id, {
        status: decision,
        resolution_notes: notes,
        refund_amount: decision === 'RESOLVED' ? Number(data.get('refund')) : 0,
      }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the decision.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose() }} title={`Review dispute ${dispute.id.slice(0, 8)}`} description="This decision applies to the demonstration only.">
      <form onSubmit={resolve} className="space-y-4">
        <p className="break-words rounded-lg bg-canvas p-3 text-sm">{dispute.description}</p>
        <fieldset>
          <legend className="text-sm font-bold">Decision</legend>
          <div className="flex flex-wrap gap-x-4">
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="decision" checked={decision === 'RESOLVED'} onChange={() => setDecision('RESOLVED')} /> Resolve claim</label>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="decision" checked={decision === 'REJECTED'} onChange={() => setDecision('REJECTED')} /> Reject claim</label>
          </div>
        </fieldset>
        {decision === 'RESOLVED' && <Input type="number" name="refund" min="0" step=".01" label="Simulated refund amount (₹)" defaultValue={dispute.refund_amount} />}
        <div><label htmlFor="resolution-notes" className="mb-1 block text-sm font-bold">Resolution notes</label><textarea id="resolution-notes" name="notes" required maxLength={1000} className="control w-full" rows={3} /></div>
        {error && <PanelError message={error} />}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" isLoading={busy}><CircleDollarSign aria-hidden="true" className="size-4" /> Save resolution</Button>
        </div>
      </form>
    </Modal>
  )
}
