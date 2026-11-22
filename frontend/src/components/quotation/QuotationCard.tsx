import React, { useState } from 'react'
import { SupplierQuotation } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'

interface QuotationCardProps {
  quotation: SupplierQuotation
  isLowestPrice?: boolean
  isOrganizer?: boolean
  onSelectQuotation?: (quotation: SupplierQuotation) => void
}

export const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  isLowestPrice = false,
  isOrganizer = false,
  onSelectQuotation,
}) => {
  const [showItems, setShowItems] = useState(false)

  const isExpired = new Date(quotation.valid_until) < new Date()
  const reference = quotation.total_retail_value
  const savings = reference ? reference - quotation.total_quoted_price : undefined

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isLowestPrice ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-50' : 'border border-stone-200'
      }`}
    >
      <div className="p-5">
        {/* Header: Supplier info & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="break-words text-lg font-bold text-brand-950">{quotation.supplier_name || 'Wholesale supplier'}</h4>
              {isLowestPrice && <Badge variant="brand">Lowest quoted price</Badge>}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Valid until: <span className="font-semibold text-stone-700">{formatDate(quotation.valid_until)}</span>
              {isExpired && <span className="text-red-500 font-bold ml-2">(Expired)</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                quotation.status === 'ACCEPTED'
                  ? 'success'
                  : quotation.status === 'REJECTED' || isExpired
                  ? 'danger'
                  : 'info'
              }
            >
              {isExpired ? 'EXPIRED' : quotation.status}
            </Badge>
          </div>
        </div>

        {/* Pricing Summary Grid */}
        <div className="my-4 grid gap-3 rounded-xl border border-line bg-canvas p-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase">Total Bid Amount</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">{formatCurrency(quotation.total_quoted_price)}</p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase">Sample retail reference</p>
            <p className="text-base font-semibold text-stone-500 line-through mt-0.5">
              {reference ? formatCurrency(reference) : 'Unavailable'}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-emerald-700 uppercase">Savings vs. retail</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {savings === undefined ? 'Unavailable' : formatCurrency(savings)}
            </p>
          </div>
        </div>

        {/* Notes if any */}
        {quotation.notes && (
          <div className="text-xs text-stone-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 mb-4">
            <span className="font-semibold text-emerald-900">Supplier Note: </span>
            {quotation.notes}
          </div>
        )}

        {/* Action and Line items expand */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
          <button
            type="button"
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            aria-expanded={showItems}
            onClick={() => setShowItems(!showItems)}
          >
            {showItems ? 'Hide Line Items ▲' : `View ${quotation.items.length} Line Items ▼`}
          </button>

          {isOrganizer && !isExpired && quotation.status === 'SUBMITTED' && onSelectQuotation && (
            <Button
              variant={isLowestPrice ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onSelectQuotation?.(quotation)}
            >
              Select Quotation
            </Button>
          )}
        </div>

        {/* Expanded Line Items Table */}
        {showItems && (
          <div className="table-scroll mt-4 border-t border-line pt-3" role="region" tabIndex={0} aria-label="Quotation line items">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-stone-100/70 text-stone-600 font-semibold">
                <tr>
                  <th className="p-2 rounded-l">Product SKU</th>
                  <th className="p-2">Sealed Packs</th>
                  <th className="p-2">Wholesale Rate</th>
                  <th className="p-2">Retail Reference</th>
                  <th className="p-2 rounded-r text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {quotation.items.map((it) => (
                  <tr key={it.id || it.variant_id} className="hover:bg-stone-50">
                    <td className="p-2 font-medium text-stone-800">
                      {it.variant_display_name || it.variant_id}
                    </td>
                    <td className="p-2 text-stone-600">{it.quoted_packs} packs</td>
                    <td className="p-2 font-semibold text-emerald-700">
                      {formatCurrency(it.quoted_price_per_pack)} / pack
                    </td>
                    <td className="p-2 text-stone-400 line-through">
                      {it.reference_retail_price ? formatCurrency(it.reference_retail_price) : '—'}
                    </td>
                    <td className="p-2 font-bold text-stone-900 text-right">
                      {formatCurrency(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}
