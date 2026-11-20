import React, { useState } from 'react'
import { DemandSummaryResponse, BuyingGroup } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

interface DemandSummaryPanelProps {
  groupId: string
  group?: BuyingGroup | null
  summary: DemandSummaryResponse | null
  isLoading: boolean
  error?: string | null
  isOrganizer: boolean
  onRequestQuotations?: () => Promise<void>
}

export const DemandSummaryPanel: React.FC<DemandSummaryPanelProps> = ({
  group,
  summary,
  isLoading,
  error,
  isOrganizer,
  onRequestQuotations,
}) => {
  const [isSubmittingSnapshot, setIsSubmittingSnapshot] = useState(false)
  const [snapshotSuccess, setSnapshotSuccess] = useState(false)

  const handleCreateSnapshot = async () => {
    if (!onRequestQuotations) return
    setIsSubmittingSnapshot(true)
    setSnapshotSuccess(false)
    try {
      await onRequestQuotations()
      setSnapshotSuccess(true)
    } finally {
      setIsSubmittingSnapshot(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-emerald-100 shadow-sm animate-pulse">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-stone-600 font-medium">Aggregating neighborhood grocery demand...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="font-semibold">Unable to load demand aggregation</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!summary || summary.items.length === 0) {
    return (
      <Card className="text-center p-10 bg-white border border-stone-200">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-2">No Grocery Demands Added Yet</h3>
        <p className="text-stone-600 max-w-md mx-auto text-sm mb-6">
          Members of {group?.name || 'this group'} have not added grocery items yet. Once members pledge their household staples, demand will automatically pool here to unlock wholesale tiers.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <div className="text-emerald-700 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-emerald-900">Household Privacy Protected</h4>
          <p className="text-xs text-emerald-700 mt-0.5">
            Individual grocery lists and delivery addresses remain completely private. This view presents anonymous pooled demand totals for volume price evaluation and supplier quotations.
          </p>
        </div>
      </div>

      {/* Aggregate Group Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Pooled Sealed Packs</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{summary.total_packs} packs</p>
          <p className="text-xs text-stone-500 mt-1">{summary.total_variants} distinct SKUs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Reference Retail Value</p>
          <p className="text-2xl font-bold text-stone-700 mt-1">{formatCurrency(summary.total_retail_value)}</p>
          <p className="text-xs text-stone-500 mt-1">Retail shop benchmark</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Est. Wholesale Cost</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(summary.estimated_wholesale_value)}</p>
          <p className="text-xs text-emerald-600 mt-1">At unlocked tier pricing</p>
        </div>

        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Est. Group Savings</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(summary.estimated_savings)}</p>
          <p className="text-xs text-emerald-100 mt-1 font-semibold">
            {summary.savings_percentage}% overall discount
          </p>
        </div>
      </div>

      {/* Organizer Action Banner */}
      {isOrganizer && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold">Ready to Request Wholesale Quotations?</h4>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Lock an immutable demand snapshot of current pooled quantities ({summary.total_packs} packs across {summary.total_variants} SKUs) and invite verified wholesalers to bid.
            </p>
            {snapshotSuccess && (
              <p className="text-emerald-300 text-xs mt-2 font-semibold">
                ✓ Demand snapshot successfully locked! Wholesalers can now submit bids.
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            className="whitespace-nowrap px-6 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm shadow-md"
            onClick={handleCreateSnapshot}
            disabled={isSubmittingSnapshot || summary.total_packs === 0}
          >
            {isSubmittingSnapshot ? 'Locking Snapshot...' : 'Lock Demand & Request Quotes'}
          </Button>
        </div>
      )}

      {/* Demand Line Items Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-base">Pooled Demand & Wholesale Tier Progress</h3>
          <span className="text-xs text-stone-500 font-medium">Sealed Retail Packaging Only</span>
        </div>

        <div className="divide-y divide-stone-100">
          {summary.items.map((item) => {
            const hasTier = Boolean(item.qualified_tier)
            const progress = item.next_tier
              ? Math.min(100, Math.round((item.total_packs / item.next_tier.min_quantity) * 100))
              : 100

            return (
              <div key={item.variant_id} className="p-5 hover:bg-stone-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 uppercase">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-stone-900 text-base">{item.product_name}</h4>
                      <span className="text-sm font-medium text-stone-600">({item.brand})</span>
                    </div>

                    <p className="text-xs text-stone-500 mt-1">
                      Packaging: <span className="font-semibold text-stone-700">{item.pack_quantity} {item.pack_unit} sealed pack</span>
                      {' • '}
                      Retail price: <span className="text-stone-700">{formatCurrency(item.reference_retail_price)} / pack</span>
                    </p>

                    {/* Progress to Next Tier */}
                    <div className="mt-3 max-w-md">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-stone-600 font-medium">
                          {item.total_packs} packs ordered ({item.total_quantity_units} {item.pack_unit} total)
                        </span>
                        {item.next_tier ? (
                          <span className="text-emerald-700 font-semibold">
                            {item.packs_to_next_tier} more packs for {item.next_tier.tier_label} ({formatCurrency(item.next_tier.price_per_pack)}/pack)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Top Wholesale Tier Reached!</span>
                        )}
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            hasTier ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Savings Status */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 text-right">
                    <div>
                      {hasTier ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="success">
                            {item.qualified_tier?.tier_label} Unlocked
                          </Badge>
                          <span className="text-sm font-bold text-emerald-700">
                            {formatCurrency(item.best_wholesale_price || 0)} / pack
                          </span>
                        </div>
                      ) : (
                        <Badge variant="warning">
                          Requires {item.next_tier?.min_quantity || 5}+ packs for wholesale
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs">
                      <span className="text-stone-500">Retail Total: </span>
                      <span className="line-through text-stone-400 font-medium mr-2">
                        {formatCurrency(item.total_retail_value)}
                      </span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {formatCurrency(item.estimated_wholesale_cost || item.total_retail_value)}
                      </span>
                    </div>

                    {item.estimated_savings && item.estimated_savings > 0 ? (
                      <span className="text-xs text-emerald-600 font-semibold mt-0.5">
                        Pool saves {formatCurrency(item.estimated_savings)} ({item.savings_percentage}%)
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
