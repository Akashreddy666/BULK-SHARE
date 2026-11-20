import React from 'react'
import { HouseholdSavingsResponse } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface SavingsBreakdownCardProps {
  savings: HouseholdSavingsResponse | null
  isLoading?: boolean
}

export const SavingsBreakdownCard: React.FC<SavingsBreakdownCardProps> = ({
  savings,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-stone-200 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-emerald-100 rounded w-1/2 mb-2" />
      </div>
    )
  }

  if (!savings || savings.items.length === 0) {
    return (
      <Card className="p-5 bg-stone-50 border border-stone-200 text-center">
        <p className="text-sm font-semibold text-stone-700">No Grocery Items in Household List</p>
        <p className="text-xs text-stone-500 mt-1">
          Add sealed grocery packages to your household list to see your personalized wholesale savings!
        </p>
      </Card>
    )
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center justify-between pb-4 border-b border-emerald-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Household Bulk Savings
          </span>
          <h3 className="text-xl font-bold mt-0.5">Your Group Purchase Breakdown</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-emerald-200 block">Total Pledged</span>
          <span className="text-base font-bold text-white">{savings.total_packs} sealed packs</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 my-5">
        <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
          <p className="text-xs text-emerald-200">Retail Shop Price</p>
          <p className="text-lg font-bold text-stone-300 line-through mt-1">
            {formatCurrency(savings.total_retail_cost)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
          <p className="text-xs text-emerald-200">Wholesale Price</p>
          <p className="text-xl font-bold text-white mt-1">
            {formatCurrency(savings.total_wholesale_cost)}
          </p>
        </div>

        <div className="bg-emerald-500/20 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-400/30">
          <p className="text-xs text-emerald-200 font-semibold">Net Household Savings</p>
          <p className="text-2xl font-black text-emerald-300 mt-0.5">
            {formatCurrency(savings.total_savings)}
          </p>
          <p className="text-xs text-emerald-200 font-medium">({savings.savings_percentage}% discount)</p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="mt-4 bg-emerald-950/60 rounded-xl p-3 border border-emerald-800/80 overflow-x-auto">
        <p className="text-xs font-semibold text-emerald-300 mb-2 px-1">Your Household Grocery Items</p>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-emerald-300 border-b border-emerald-800/60">
              <th className="pb-2 font-medium">Product SKU</th>
              <th className="pb-2 font-medium">Preference</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Retail</th>
              <th className="pb-2 font-medium">Wholesale</th>
              <th className="pb-2 font-medium text-right">You Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-800/40">
            {savings.items.map((it) => (
              <tr key={it.variant_id} className="text-stone-200">
                <td className="py-2.5 font-medium">{it.variant_display_name}</td>
                <td className="py-2.5">
                  <Badge variant={it.brand_preference === 'EXACT' ? 'info' : 'outline'}>
                    {it.brand_preference}
                  </Badge>
                </td>
                <td className="py-2.5">{it.pack_quantity} packs</td>
                <td className="py-2.5 line-through text-stone-400">
                  {formatCurrency(it.retail_total)}
                </td>
                <td className="py-2.5 font-bold text-white">
                  {formatCurrency(it.wholesale_total || it.retail_total)}
                </td>
                <td className="py-2.5 text-right font-bold text-emerald-300">
                  {it.savings_amount && it.savings_amount > 0 ? (
                    `+${formatCurrency(it.savings_amount)} (${it.savings_percentage}%)`
                  ) : (
                    <span className="text-stone-400 font-normal">Tier locked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
