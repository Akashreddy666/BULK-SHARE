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

  const sorted = [...quotations].sort((left, right) => left.total_quoted_price - right.total_quoted_price)
  const now = Date.now()
  const lowest = sorted.find((quote) => quote.status === 'SUBMITTED' && new Date(quote.valid_until).getTime() > now)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
        <h4 className="font-bold">{quotations.length} supplier {quotations.length === 1 ? 'quotation' : 'quotations'}</h4>
        {lowest && <p>Lowest active quote <strong>{formatCurrency(lowest.total_quoted_price)}</strong></p>}
      </div>

      {/* Grid of Quotation Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sorted.map((quote) => (
          <QuotationCard
            key={quote.id}
            quotation={quote}
            isLowestPrice={quote.id === lowest?.id}
            isOrganizer={isOrganizer}
            onSelectQuotation={onSelectQuotation}
          />
        ))}
      </div>
    </div>
  )
}
