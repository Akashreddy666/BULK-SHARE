import React, { useState, useEffect } from 'react'
import {
  Store,
  Layers,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Sparkles,
  TrendingUp,
  Send,
  Building,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  SupplierProfile,
  SupplierProductOffer,
  BuyingGroup,
  DemandSnapshot,
  DemandSummaryResponse,
} from '@/types'
import { api, ApiError } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SupplierDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [offers, setOffers] = useState<SupplierProductOffer[]>([])
  const [quotingGroups, setQuotingGroups] = useState<BuyingGroup[]>([])
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
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const loadSupplierData = async () => {
    setIsLoading(true)
    try {
      // 1. Load or initialize profile
      try {
        const prof = await api.getMySupplierProfile()
        setProfile(prof)
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          // Auto create profile for demo supplier
          const newProf = await api.createSupplierProfile({
            company_name: user?.full_name || 'Kisan Wholesale Supplies',
            city: 'Bengaluru',
            phone: user?.phone || '+91 98765 43212',
            description: 'APMC licensed wholesale grains & staple groceries distributor.',
          })
          setProfile(newProf)
        }
      }

      // 2. Load offers
      const off = await api.getMySupplierOffers()
      setOffers(off)

      // 3. Load groups in QUOTING or OPEN status with snapshots
      const grps = await api.getGroups()
      setQuotingGroups(grps)
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSupplierData()
  }, [])

  const handleOpenQuoteModal = async (group: BuyingGroup) => {
    setQuoteError(null)
    setQuoteSuccessMsg(null)
    try {
      const snapshots = await api.getDemandSnapshots(group.id)
      if (snapshots.length === 0) {
        alert('This group has not published an active demand snapshot yet.')
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
      setQuoteNotes('Stock verified at Yeshwanthpur APMC Hub. Sealed manufacturer packs with batch test certificates.')

      setQuotingSnapshot({
        groupId: group.id,
        groupName: group.name,
        snapshot: latestSnapshot,
        summary,
      })
      setIsQuoteModalOpen(true)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to load group demand snapshot')
    }
  }

  const handleSubmitQuote = async () => {
    if (!quotingSnapshot) return
    setIsSubmittingQuote(true)
    setQuoteError(null)
    setQuoteSuccessMsg(null)

    try {
      const itemsPayload = Object.entries(bidPrices).map(([variant_id, price]) => ({
        variant_id,
        quoted_price_per_pack: Number(price),
      }))

      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 3)

      await api.submitQuotation({
        demand_snapshot_id: quotingSnapshot.snapshot.id,
        valid_until: expiry.toISOString(),
        notes: quoteNotes,
        items: itemsPayload,
      })

      setQuoteSuccessMsg('Wholesale quotation submitted successfully! The group organizer can now evaluate your bid.')
      setTimeout(() => {
        setIsQuoteModalOpen(false)
        setQuotingSnapshot(null)
      }, 1800)
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
  const modalSavings = Math.max(0, modalRetailTotal - modalTotal)
  const modalPct = modalRetailTotal > 0 ? Math.round((modalSavings / modalRetailTotal) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">
              {profile?.company_name || user?.full_name || 'Wholesale Supplier'}
            </h1>
            <Badge variant="success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified APMC Wholesaler
            </Badge>
          </div>
          <p className="text-sm text-stone-500">
            Registered wholesale vendor supplying sealed staple packages to Bengaluru neighborhood buying groups.
          </p>
          {profile?.city && (
            <p className="text-xs text-stone-400 font-medium">
              Location: {profile.city} {profile.gstin ? `• GSTIN: ${profile.gstin}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Role Persona
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Catalog Offers</p>
              <h3 className="text-xl font-bold text-stone-900 mt-0.5">{offers.length || 6} SKUs</h3>
              <p className="text-[11px] text-sky-600 font-medium mt-0.5">Sealed retail packs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Active Buying Pools</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">{quotingGroups.length} Groups</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Bengaluru layouts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Verified Status</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">Accredited</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Simulated bulk supplier</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Pricing Model</p>
              <h3 className="text-xl font-bold text-purple-700 mt-0.5">Volume Tiers</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Independent per-SKU rules</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available RFQs / Demand Snapshots for Quotations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Neighborhood Buying Groups & Quotation RFQs</h3>
            <p className="text-xs text-stone-500">
              Review pooled demand requirements and submit competitive wholesale bids directly to group organizers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  Target Deadline: <strong className="text-stone-700">{formatDate(grp.deadline)}</strong>
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenQuoteModal(grp)}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Quotation
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Wholesale Product Offerings & Price Tiers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Wholesale Catalog & Quantity Price Tiers</CardTitle>
            <CardDescription className="text-xs">
              Configured per sealed pack with independent quantity minimum thresholds (Milestone 3).
            </CardDescription>
          </div>
          <Badge variant="brand">Sealed Packs Only</Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Pack Specification</th>
                  <th className="pb-3">Retail Reference</th>
                  <th className="pb-3">Tier 1 (5+ packs)</th>
                  <th className="pb-3">Tier 2 (15+ packs)</th>
                  <th className="pb-3">Tier 3 (30+ packs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-3 font-semibold text-stone-900">Sona Masoori Rice (India Gate)</td>
                  <td className="py-3 text-stone-600">5 kg sealed bag</td>
                  <td className="py-3 text-stone-400 line-through">₹360 / pack</td>
                  <td className="py-3 text-emerald-700 font-semibold">₹306 / pack (15% off)</td>
                  <td className="py-3 text-emerald-700 font-bold">₹280 / pack (22% off)</td>
                  <td className="py-3 text-emerald-800 font-extrabold">₹252 / pack (30% off)</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-stone-900">Refined Sunflower Oil (Freedom)</td>
                  <td className="py-3 text-stone-600">5 L sealed can</td>
                  <td className="py-3 text-stone-400 line-through">₹720 / can</td>
                  <td className="py-3 text-emerald-700 font-semibold">₹612 / can (15% off)</td>
                  <td className="py-3 text-emerald-700 font-bold">₹561 / can (22% off)</td>
                  <td className="py-3 text-emerald-800 font-extrabold">₹504 / can (30% off)</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-stone-900">Premium Toor Dal (Tata Sampann)</td>
                  <td className="py-3 text-stone-600">1 kg sealed pack</td>
                  <td className="py-3 text-stone-400 line-through">₹175 / pack</td>
                  <td className="py-3 text-emerald-700 font-semibold">₹148 / pack (15% off)</td>
                  <td className="py-3 text-emerald-700 font-bold">₹136 / pack (22% off)</td>
                  <td className="py-3 text-emerald-800 font-extrabold">₹122 / pack (30% off)</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-stone-900">Refined Sugar (Madhur)</td>
                  <td className="py-3 text-stone-600">1 kg sealed pouch</td>
                  <td className="py-3 text-stone-400 line-through">₹50 / pack</td>
                  <td className="py-3 text-emerald-700 font-semibold">₹42 / pack (15% off)</td>
                  <td className="py-3 text-emerald-700 font-bold">₹39 / pack (22% off)</td>
                  <td className="py-3 text-emerald-800 font-extrabold">₹35 / pack (30% off)</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-stone-900">Whole Wheat Atta (Aashirvaad)</td>
                  <td className="py-3 text-stone-600">5 kg sealed bag</td>
                  <td className="py-3 text-stone-400 line-through">₹255 / pack</td>
                  <td className="py-3 text-emerald-700 font-semibold">₹216 / pack (15% off)</td>
                  <td className="py-3 text-emerald-700 font-bold">₹198 / pack (22% off)</td>
                  <td className="py-3 text-emerald-800 font-extrabold">₹178 / pack (30% off)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Submit Quotation Modal */}
      {quotingSnapshot && (
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          title={`Submit Wholesale Quotation for ${quotingSnapshot.groupName}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
              Demand Snapshot #{quotingSnapshot.snapshot.snapshot_version} • Total Pooled Demand: <strong>{quotingSnapshot.summary.total_packs} sealed packs</strong> across {quotingSnapshot.summary.total_variants} SKUs.
            </div>

            {quoteError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                {quoteError}
              </div>
            )}

            {quoteSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                {quoteSuccessMsg}
              </div>
            )}

            {/* Line items pricing entry */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-stone-900">Specify Wholesale Bid per Sealed Pack</h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {quotingSnapshot.summary.items.map((it) => (
                  <div key={it.variant_id} className="p-3 flex items-center justify-between gap-4 bg-white">
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
                        min="1"
                        value={bidPrices[it.variant_id] || ''}
                        onChange={(e) =>
                          setBidPrices({ ...bidPrices, [it.variant_id]: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 text-sm font-bold text-emerald-800 border border-stone-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-stone-500">/ pack</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Pricing Totals Callout */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-stone-500 block">Retail Benchmark</span>
                <span className="font-bold text-stone-600 line-through">{formatCurrency(modalRetailTotal)}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Your Quoted Bid</span>
                <span className="font-bold text-stone-900 text-sm">{formatCurrency(modalTotal)}</span>
              </div>
              <div>
                <span className="text-emerald-700 block font-semibold">Community Saves</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(modalSavings)} ({modalPct}%)
                </span>
              </div>
            </div>

            {/* Supplier Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Dispatch & Delivery Terms Note</label>
              <textarea
                rows={2}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="e.g. Dispatched from APMC yard, batch expiration 12 months, free delivery to society gate."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
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
    </div>
  )
}
