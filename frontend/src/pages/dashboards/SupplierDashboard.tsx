import { useState, useEffect } from 'react'
import { Check, CheckCircle, Clock, FileText, PackageCheck, Plus, Send, Settings, Store, Truck } from 'lucide-react'
import { Dashboard, DashboardHeader, DashboardNav, Metric, PanelError, PanelLoading } from '@/components/dashboard/Dashboard'
import { SupplierOfferForm, SupplierProfileForm } from '@/components/dashboard/SupplierForms'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import {
  SupplierProfile,
  SupplierProductOffer,
  BuyingGroup,
  DemandSnapshot,
  DemandSummaryResponse,
  ProcurementOrder,
  SupplierQuotation,
} from '@/types'
import { api, ApiError } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'

const sections = [
  { id: 'requests', label: 'Quote requests', icon: FileText },
  { id: 'history', label: 'Submitted quotes', icon: CheckCircle },
  { id: 'offers', label: 'Product offers', icon: Store },
  { id: 'orders', label: 'Purchase orders', icon: Truck },
] as const

export function SupplierDashboard() {
  const { user } = useAuth()
  const notify = useToast()
  const [tab, setTab] = useState<typeof sections[number]['id']>('requests')
  const [loadError, setLoadError] = useState('')
  const [quoteHistory, setQuoteHistory] = useState<{ quote: SupplierQuotation; groupName: string }[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyRevision, setHistoryRevision] = useState(0)
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<SupplierProductOffer | null | undefined>(undefined)
  const [openingQuote, setOpeningQuote] = useState<string | null>(null)
  const [groups, setGroups] = useState<BuyingGroup[]>([])
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [offers, setOffers] = useState<SupplierProductOffer[]>([])
  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>([])
  const [isUpdatingPo, setIsUpdatingPo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // RFQ Quotation Modal
  const [quotingSnapshot, setQuotingSnapshot] = useState<{
    groupId: string
    groupName: string
    snapshot: DemandSnapshot
    summary: DemandSummaryResponse
  } | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [bidPrices, setBidPrices] = useState<Record<string, number>>({})
  const [quoteNotes, setQuoteNotes] = useState('')
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const quotingGroups = groups.filter((group) => group.status === 'QUOTING' || group.status === 'OPEN')

  const loadSupplierData = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const [savedProfile, buyingGroups, orders] = await Promise.all([
        api.getMySupplierProfile().catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 404) return null
          throw error
        }),
        api.getGroups(),
        api.getSupplierProcurementOrders(),
      ])
      setProfile(savedProfile)
      setGroups(buyingGroups)
      setProcurementOrders(orders)
      setOffers(savedProfile ? await api.getMySupplierOffers() : [])
    } catch {
      setLoadError('The supplier workspace could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadSupplierData() }, [])

  useEffect(() => {
    if (tab !== 'history' || isLoading || loadError || !profile) return
    let current = true
    setIsHistoryLoading(true)
    setHistoryError('')

    Promise.all(groups.map(async (group) => {
      const quotes = await api.getGroupQuotations(group.id)
      return quotes.filter((quote) => quote.supplier_id === profile.id).map((quote) => ({ quote, groupName: group.name }))
    }))
      .then((entries) => {
        if (current) setQuoteHistory(entries.flat().sort((left, right) => right.quote.created_at.localeCompare(left.quote.created_at)))
      })
      .catch(() => { if (current) setHistoryError('Your submitted quotations could not be loaded.') })
      .finally(() => { if (current) setIsHistoryLoading(false) })

    return () => { current = false }
  }, [tab, groups, profile, isLoading, loadError, historyRevision])

  const handleUpdatePoStatus = async (poId: string, newStatus: string) => {
    try {
      setIsUpdatingPo(poId)
      await api.updateProcurementStatus(poId, { status: newStatus })
      const pos = await api.getSupplierProcurementOrders()
      setProcurementOrders(pos)
      notify('Purchase order status updated.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update the purchase order.', 'error')
    } finally {
      setIsUpdatingPo(null)
    }
  }

  const handleOpenQuoteModal = async (group: BuyingGroup) => {
    setQuoteError(null)
    setOpeningQuote(group.id)
    try {
      const snapshots = await api.getDemandSnapshots(group.id)
      if (snapshots.length === 0) {
        notify('This group has not published a demand snapshot yet.', 'error')
        return
      }
      const latestSnapshot = snapshots[0]
      const summary: DemandSummaryResponse = JSON.parse(latestSnapshot.snapshot_data)

      // Initialize default bids from retail reference discounted by ~18%
      const initialBids: Record<string, number> = {}
      summary.items.forEach((it) => {
        const defaultRate = Math.round(it.reference_retail_price * 0.82)
        initialBids[it.variant_id] = defaultRate
      })
      setBidPrices(initialBids)
      setQuoteNotes('')

      setQuotingSnapshot({
        groupId: group.id,
        groupName: group.name,
        snapshot: latestSnapshot,
        summary,
      })
      setIsQuoteModalOpen(true)
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not load the demand snapshot.', 'error')
    } finally {
      setOpeningQuote(null)
    }
  }

  const handleSubmitQuote = async () => {
    if (!quotingSnapshot) return
    setIsSubmittingQuote(true)
    setQuoteError(null)

    try {
      const itemsPayload = Object.entries(bidPrices).map(([variant_id, price]) => ({
        variant_id,
        quoted_price_per_pack: Number(price),
      }))

      if (!itemsPayload.length || itemsPayload.some(({ quoted_price_per_pack }) => !Number.isFinite(quoted_price_per_pack) || quoted_price_per_pack < .01)) {
        setQuoteError('Enter a positive per-pack price for every item.')
        return
      }

      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 3)

      await api.submitQuotation({
        demand_snapshot_id: quotingSnapshot.snapshot.id,
        valid_until: expiry.toISOString(),
        notes: quoteNotes,
        items: itemsPayload,
      })

      setIsQuoteModalOpen(false)
      setQuotingSnapshot(null)
      setTab('history')
      setHistoryRevision((value) => value + 1)
      notify('Quotation submitted to the group organizer.')
    } catch (err: unknown) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to submit quotation')
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  // Calculate live total quoted price in modal
  const modalTotal = quotingSnapshot?.summary.items.reduce((sum, it) => {
    const rate = bidPrices[it.variant_id] || 0
    return sum + rate * it.total_packs
  }, 0) || 0

  const modalRetailTotal = quotingSnapshot?.summary.total_retail_value || 0
  const modalSavings = modalRetailTotal - modalTotal
  const modalPct = modalRetailTotal > 0 ? Math.round((modalSavings / modalRetailTotal) * 100) : 0

  return (
    <Dashboard>
      <DashboardHeader role="Supplier workspace" title={profile?.company_name || user?.full_name || 'Wholesale supplier'} icon={Store}
        description={profile ? <>{profile.city} · {profile.is_verified ? 'Verified in the demo' : 'Verification pending'}{profile.description && <span className="mt-1 block">{profile.description}</span>}</> : 'Set up your business profile, manage sealed-pack offers and review neighborhood demand.'}>
        <Button variant="outline" onClick={() => setProfileOpen(true)} disabled={isLoading || !!loadError}>
          <Settings aria-hidden="true" className="size-4" /> {profile ? 'Edit profile' : 'Set up profile'}
        </Button>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Active product offers" value={isLoading || loadError ? '—' : offers.filter((offer) => offer.is_active).length} icon={Store} />
        <Metric label="Open buying groups" value={isLoading || loadError ? '—' : quotingGroups.length} icon={Clock} />
        <Metric label="Purchase orders" value={isLoading || loadError ? '—' : procurementOrders.length} icon={Truck} />
      </div>

      <div className="rounded-panel border border-line bg-white p-3">
        <DashboardNav label="Supplier views" items={sections} value={tab} onChange={setTab} />
      </div>
      {isLoading && <PanelLoading label="Loading supplier workspace" />}
      {loadError && <PanelError message={loadError} onRetry={loadSupplierData} />}

      {/* Wholesale Purchase Orders (Milestone 5) */}
      {!isLoading && !loadError && tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Wholesale Purchase Orders (POs)</h3>
              <p className="text-xs text-stone-500">
                Official procurement orders placed by Platform Admins for fulfillment and hub delivery.
              </p>
            </div>
            <Badge variant="brand">{procurementOrders.length} Assigned</Badge>
          </div>

          {procurementOrders.length === 0 && <Card className="p-5 text-sm text-slate-600">Issued purchase orders will appear here.</Card>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {procurementOrders.map((po) => (
              <Card key={po.id} className="p-5 border border-stone-200 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-stone-900">{po.po_number}</span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Placed: {new Date(po.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      po.status === 'DELIVERED_TO_HUB'
                        ? 'success'
                        : po.status === 'DISPATCHED_TO_HUB'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {po.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-600">Wholesale Order Value:</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {formatCurrency(po.total_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {po.status === 'PLACED' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePoStatus(po.id, 'CONFIRMED_BY_SUPPLIER')}
                      disabled={isUpdatingPo === po.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Acknowledge PO
                    </Button>
                  )}
                  {po.status === 'CONFIRMED_BY_SUPPLIER' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePoStatus(po.id, 'DISPATCHED_TO_HUB')}
                      disabled={isUpdatingPo === po.id}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
                    >
                      <Truck className="w-3.5 h-3.5 mr-1" />
                      Dispatch to Hub
                    </Button>
                  )}
                  {po.status === 'DISPATCHED_TO_HUB' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePoStatus(po.id, 'DELIVERED_TO_HUB')}
                      disabled={isUpdatingPo === po.id}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      <PackageCheck className="w-3.5 h-3.5 mr-1" />
                      Mark Delivered to Hub
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !loadError && tab === 'requests' && (
      <section className="space-y-4" aria-label="Quotation requests">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Neighborhood quote requests</h3>
            <p className="text-xs text-stone-500">
              Review pooled demand requirements and submit competitive wholesale bids directly to group organizers.
            </p>
          </div>
        </div>

        {quotingGroups.length === 0 && <Card className="p-5 text-sm text-slate-600">No buying groups are currently accepting requests.</Card>}
        {profile && !profile.is_verified && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Verification is required before you can submit quotations.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotingGroups.map((grp) => (
            <Card key={grp.id} className="p-5 border border-stone-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{grp.name}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {grp.neighborhood?.name || 'Bengaluru'} • {grp.members_count} households
                  </p>
                </div>
                <Badge variant={grp.status === 'QUOTING' ? 'warning' : 'info'}>
                  {grp.status}
                </Badge>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 mt-3">
                {grp.description || 'Staple grocery pool looking for certified bulk wholesale suppliers.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <span className="text-xs text-stone-500">
                  Target Deadline: <strong className="text-stone-700">{formatDate(grp.deadline)}</strong>
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenQuoteModal(grp)}
                  disabled={!profile?.is_verified || !!openingQuote}
                  isLoading={openingQuote === grp.id}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Quotation
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
      )}

      {!isLoading && !loadError && tab === 'history' && (
        <Card>
          <CardHeader><CardTitle>Submitted quotations</CardTitle><CardDescription>Review your own bids, totals and validity dates.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {isHistoryLoading ? <PanelLoading label="Loading submitted quotations" count={2} /> : historyError ? <PanelError message={historyError} onRetry={() => setHistoryRevision((value) => value + 1)} /> : quoteHistory.length ? quoteHistory.map(({ quote, groupName }) => {
              const status = quote.status === 'SUBMITTED' && new Date(quote.valid_until) < new Date() ? 'EXPIRED' : quote.status
              return (
                <div key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4 text-sm">
                  <div><p className="font-bold">{groupName}</p><p className="mt-1 text-slate-600">Valid through {formatDate(quote.valid_until)}</p></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="tabular-nums">{formatCurrency(quote.total_quoted_price)}</strong>
                    <Badge variant={status === 'ACCEPTED' ? 'success' : 'neutral'}>{status.toLowerCase()}</Badge>
                  </div>
                </div>
              )
            }) : <p className="text-sm text-slate-600">Your submitted quotes will appear here.</p>}
          </CardContent>
        </Card>
      )}

      {!isLoading && !loadError && tab === 'offers' && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>Product offers &amp; quantity pricing</CardTitle><CardDescription>Prices and order minimums for your sealed-pack offers.</CardDescription></div>
            {profile?.is_verified && <Button onClick={() => setEditingOffer(null)}><Plus aria-hidden="true" className="size-4" /> Add offer</Button>}
          </CardHeader>
          <CardContent>
            {offers.length ? (
              <div className="table-scroll" tabIndex={0} role="region" aria-label="Your wholesale offers">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead><tr>{['Catalog pack', 'Price per pack', 'Order quantity', 'Status', 'Action'].map((label) => <th key={label} scope="col" className="px-3 py-3">{label}</th>)}</tr></thead>
                  <tbody className="divide-y divide-line">
                    {offers.map((offer) => (
                      <tr key={offer.id}>
                        <th scope="row" className="!bg-white px-3 py-3">{offer.variant_display_name || offer.variant_id}</th>
                        <td className="px-3 py-3 font-bold tabular-nums">{formatCurrency(offer.offer_price_per_pack)}</td>
                        <td className="px-3 py-3">{offer.max_order_packs === null || offer.max_order_packs === undefined ? `${offer.min_order_packs}+` : `${offer.min_order_packs}–${offer.max_order_packs}`} packs</td>
                        <td className="px-3 py-3"><Badge variant={offer.is_active ? 'success' : 'neutral'}>{offer.is_active ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-3 py-3"><Button variant="ghost" size="sm" onClick={() => setEditingOffer(offer)} aria-label={`Edit ${offer.variant_display_name || offer.variant_id}`}>Edit</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-slate-600">{profile?.is_verified ? 'Add your first offer using a sealed pack from the catalog.' : 'Verified suppliers can publish wholesale product offers.'}</p>}
          </CardContent>
        </Card>
      )}

      {isProfileOpen && (
        <SupplierProfileForm profile={profile} name={user?.full_name ?? ''} onClose={() => setProfileOpen(false)} onSave={(updated) => {
          setProfile(updated)
          setProfileOpen(false)
          notify('Supplier profile saved.')
        }} />
      )}
      {editingOffer !== undefined && (
        <SupplierOfferForm offer={editingOffer} onClose={() => setEditingOffer(undefined)} onSave={(updated) => {
          setOffers((previous) => previous.some((offer) => offer.id === updated.id) ? previous.map((offer) => offer.id === updated.id ? updated : offer) : [...previous, updated])
          setEditingOffer(undefined)
          notify('Wholesale offer saved.')
        }} />
      )}

      {/* Submit Quotation Modal */}
      {quotingSnapshot && (
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={() => { if (!isSubmittingQuote) setIsQuoteModalOpen(false) }}
          title={`Submit Wholesale Quotation for ${quotingSnapshot.groupName}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
              Demand Snapshot #{quotingSnapshot.snapshot.snapshot_version} • Total Pooled Demand: <strong>{quotingSnapshot.summary.total_packs} sealed packs</strong> across {quotingSnapshot.summary.total_variants} SKUs.
            </div>

            {quoteError && (
              <div role="alert" className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                {quoteError}
              </div>
            )}

            {/* Line items pricing entry */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-stone-900">Specify Wholesale Bid per Sealed Pack</h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {quotingSnapshot.summary.items.map((it) => (
                  <div key={it.variant_id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-3">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{it.variant_display_name}</p>
                      <p className="text-[11px] text-stone-500">
                        {it.total_packs} packs ordered • Retail: {formatCurrency(it.reference_retail_price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-600">₹</span>
                      <input
                        type="number"
                        min=".01"
                        step=".01"
                        aria-label={`Price per pack for ${it.variant_display_name}`}
                        value={bidPrices[it.variant_id] || ''}
                        onChange={(e) =>
                          setBidPrices({ ...bidPrices, [it.variant_id]: Number(e.target.value) })
                        }
                        className="control w-28 text-right font-bold"
                      />
                      <span className="text-xs text-stone-500">/ pack</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Pricing Totals Callout */}
            <div className="grid gap-3 rounded-xl border border-line bg-canvas p-4 text-sm sm:grid-cols-3">
              <div>
                <span className="text-stone-500 block">Retail Benchmark</span>
                <span className="font-bold text-stone-600 line-through">{formatCurrency(modalRetailTotal)}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Your Quoted Bid</span>
                <span className="font-bold text-stone-900 text-sm">{formatCurrency(modalTotal)}</span>
              </div>
              <div>
                <span className="text-emerald-700 block font-semibold">Savings vs. retail</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(modalSavings)} ({modalPct}%)
                </span>
              </div>
            </div>

            {/* Supplier Notes */}
            <div className="space-y-1">
              <label htmlFor="supplier-quote-notes" className="text-sm font-semibold">Dispatch and delivery notes</label>
              <textarea
                id="supplier-quote-notes"
                rows={2}
                maxLength={1000}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="e.g. Dispatched from APMC yard, batch expiration 12 months, free delivery to society gate."
                className="control w-full"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuoteModalOpen(false)}
                disabled={isSubmittingQuote}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitQuote}
                isLoading={isSubmittingQuote}
              >
                Submit Wholesale Quotation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Dashboard>
  )
}
