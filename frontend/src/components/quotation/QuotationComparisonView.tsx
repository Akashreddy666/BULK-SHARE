import React from 'react'
import { SupplierQuotation } from '@/types'
import { QuotationCard } from '@/components/quotation/QuotationCard'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

interface QuotationComparisonViewProps {
  quotations: SupplierQuotation[]
  isLoading: boolean
  isOrganizer?: boolean
  onSelectQuotation?: (quotation: SupplierQuotation) => void
}

export const QuotationComparisonView: React.FC<QuotationComparisonViewProps> = ({
  quotations,
  isLoading,
  isOrganizer = false,
  onSelectQuotation,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-stone-200 animate-pulse">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-stone-600 text-sm">Retrieving wholesale supplier quotations...</p>
      </div>
    )
  }

  if (quotations.length === 0) {
    return (
      <Card className="text-center p-8 bg-stone-50 border border-stone-200">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h4 className="text-base font-bold text-stone-900">Awaiting Supplier Quotations</h4>
        <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
          Once the demand snapshot is published, accredited wholesalers submit competitive sealed bids here for organizer selection.
        </p>
      </Card>
    )
  }

  // Sort quotations by price ascending (best price first)
  const sorted = [...quotations].sort((a, b) => a.total_quoted_price - b.total_quoted_price)
  const lowestPriceId = sorted[0]?.id
  const lowestPrice = sorted[0]?.total_quoted_price || 0
  const maxSavings = sorted[0]?.savings_amount || 0
  const maxPct = sorted[0]?.savings_percentage || 0

  return (
    <div className="space-y-6">
      {/* Comparative Header Callout */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">
            {quotations.length} Wholesale {quotations.length === 1 ? 'Bid Received' : 'Bids Received'}
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Best available group price: <span className="font-bold text-emerald-900">{formatCurrency(lowestPrice)}</span>
            {' • '}
            Saves up to <span className="font-bold text-emerald-900">{formatCurrency(maxSavings)}</span> ({maxPct}% off retail)
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-full self-start sm:self-auto">
          Single Supplier Policy (MVP)
        </span>
      </div>

      {/* Grid of Quotation Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sorted.map((quote) => (
          <QuotationCard
            key={quote.id}
            quotation={quote}
            isLowestPrice={quote.id === lowestPriceId}
            isOrganizer={isOrganizer}
            onSelectQuotation={onSelectQuotation}
          />
        ))}
      </div>
    </div>
  )
}
