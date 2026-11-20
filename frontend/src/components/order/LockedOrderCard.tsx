import React, { useState } from 'react'
import { GroupOrder } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Lock, ShieldCheck, CheckCircle } from 'lucide-react'

interface LockedOrderCardProps {
  order: GroupOrder
}

export const LockedOrderCard: React.FC<LockedOrderCardProps> = ({ order }) => {
  const [showAllocations, setShowAllocations] = useState(false)

  let parsedAllocations: any = null
  try {
    parsedAllocations = JSON.parse(order.order_allocations_data)
  } catch {
    // fallback
  }

  return (
    <Card className="border-2 border-emerald-500 shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                Immutable Locked Group Order
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {order.supplier_name || 'Wholesale Supplier Partner'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" className="bg-emerald-500/30 text-white border-white/20 font-bold">
              <CheckCircle className="w-3 h-3 mr-1" />
              LOCKED & FROZEN
            </Badge>
          </div>
        </div>

        <p className="text-xs text-emerald-100 mt-2">
          Locked on {formatDate(order.locked_at)} • Order ID: <code className="font-mono text-emerald-200">{order.id.slice(0, 8)}</code>
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Metric summary */}
        <div className="grid grid-cols-3 gap-3 text-center bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Total Volume</span>
            <span className="text-xl font-bold text-stone-900 mt-0.5 block">{order.total_packs} packs</span>
            <span className="text-[10px] text-stone-400">Sealed retail bags</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Wholesale Payable</span>
            <span className="text-xl font-bold text-stone-900 mt-0.5 block">
              {formatCurrency(order.total_wholesale_amount)}
            </span>
            <span className="text-[10px] text-stone-400">Quoted bulk price</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Total Community Savings</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {formatCurrency(order.total_savings_amount)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">vs supermarket MRP</span>
          </div>
        </div>

        {/* Locked Business Rule Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Order Freezing Enforced:</strong> Per business rules, household items and allocation values are frozen. Member cancellations are disabled; any modifications now require administrator intervention.
          </p>
        </div>

        {/* Toggle Allocations */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllocations(!showAllocations)}
          >
            {showAllocations ? 'Hide Frozen Allocation Details' : 'View Frozen Allocation Details'}
          </Button>

          <span className="text-xs text-stone-500">
            {parsedAllocations?.members?.length || 0} Confirmed Households
          </span>
        </div>

        {/* Allocation detail JSON breakdown */}
        {showAllocations && parsedAllocations && (
          <div className="mt-3 pt-3 border-t border-stone-200 text-xs space-y-3">
            <h5 className="font-bold text-stone-800">Confirmed Household Allocations</h5>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              {parsedAllocations.members.map((m: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between bg-white text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block">{m.user_name}</span>
                    <span className="text-[11px] text-stone-500">
                      Mode: <strong className="text-stone-700">{m.fulfillment_preference}</strong>
                      {m.delivery_address && ` • ${m.delivery_address}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{formatCurrency(m.household_cost)}</span>
                    <span className="text-[11px] text-emerald-700 font-semibold block">
                      Saved {formatCurrency(m.household_savings)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
