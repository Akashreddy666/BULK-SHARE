import React, { useState, useEffect, useRef } from 'react'
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Search,
} from 'lucide-react'
import { Product, ProductVariant, ProductCategory, BrandPreference } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PanelError, PanelLoading } from '@/components/dashboard/Dashboard'
import { formatCurrency } from '@/lib/utils'

interface ProductCatalogModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  onItemAdded?: () => void
}

const CATEGORIES: { label: string; value: ProductCategory | 'ALL' }[] = [
  { label: 'All Staples', value: 'ALL' },
  { label: 'Rice', value: 'RICE' },
  { label: 'Cooking Oil', value: 'OIL' },
  { label: 'Dal & Pulses', value: 'DAL' },
  { label: 'Sugar', value: 'SUGAR' },
  { label: 'Flour / Atta', value: 'FLOUR' },
]

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  onItemAdded,
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Selection states per variant
  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({})
  const [brandPrefs, setBrandPrefs] = useState<Record<string, BrandPreference>>({})
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)

  const addedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(addedTimer.current), [])

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setIsLoading(true)
    setLoadError(false)
    setError(null)
    api.getProducts(selectedCategory === 'ALL' ? undefined : selectedCategory)
      .then((data) => { if (active) setProducts(data) })
      .catch(() => { if (active) setLoadError(true) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [isOpen, selectedCategory, retry])

  const handleQuantityChange = (variantId: string, delta: number) => {
    setPackQuantities((prev) => {
      const current = prev[variantId] || 1
      const nextVal = Math.max(1, current + delta)
      return { ...prev, [variantId]: nextVal }
    })
  }

  const handleBrandPrefChange = (variantId: string, pref: BrandPreference) => {
    setBrandPrefs((prev) => ({ ...prev, [variantId]: pref }))
  }

  const handleAddToList = async (variant: ProductVariant) => {
    setAddingVariantId(variant.id)
    setError(null)
    try {
      const pack_quantity = packQuantities[variant.id] || 1
      const brand_preference = brandPrefs[variant.id] || 'EXACT'

      await api.addGroceryItem(groupId, {
        variant_id: variant.id,
        pack_quantity,
        brand_preference,
      })

      setAddedVariantId(variant.id)
      window.clearTimeout(addedTimer.current)
      addedTimer.current = window.setTimeout(() => setAddedVariantId(null), 2000)
      onItemAdded?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to add item to your grocery list.')
      }
    } finally {
      setAddingVariantId(null)
    }
  }

  const query = search.trim().toLowerCase()
  const visibleProducts = products
    .map((product) => ({
      ...product,
      variants: product.variants.filter((variant) => [product.name, variant.brand, variant.sku].some((value) => value.toLowerCase().includes(query))),
    }))
    .filter((product) => product.variants.length > 0)
  const categoryImages: Partial<Record<ProductCategory, string>> = { RICE: 'rice', OIL: 'oil', DAL: 'dal', FLOUR: 'flour' }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Browse Grocery Catalog"
      description={`Add sealed staple packages to your household list for "${groupName}".`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
          <input type="search" aria-label="Search grocery catalog" placeholder="Search products, brands or packs" className="control w-full pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {/* Category Pills */}
        <div role="group" aria-label="Product categories" className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              aria-pressed={selectedCategory === cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`min-h-10 rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Every item is a manufacturer-sealed pack. Your selections are private.
        </p>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <p role="status" className="sr-only">{addedVariantId ? 'Item added to your grocery list.' : ''}</p>

        {/* Product List */}
        {isLoading ? (
          <PanelLoading label="Loading staple groceries" count={2} />
        ) : loadError ? (
          <PanelError message="The grocery catalog could not be loaded." onRetry={() => setRetry((value) => value + 1)} />
        ) : visibleProducts.length === 0 ? (
          <p className="rounded-panel border border-line bg-canvas p-5 text-sm text-slate-700">No packs match your search or category.</p>
        ) : (
          <div className="space-y-3">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="space-y-3 rounded-panel border border-line bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  {categoryImages[product.category] && <img src={`/pantry/${categoryImages[product.category]}.webp`} alt="" width="72" height="72" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover sm:size-[4.5rem]" />}
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">
                      {product.category}
                    </Badge>
                    <h3 className="text-lg font-bold text-brand-950">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{product.description}</p>
                    )}
                  </div>
                </div>

                {/* Variants List */}
                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 space-y-3">
                  {product.variants.map((v) => {
                    const qty = packQuantities[v.id] || 1
                    const pref = brandPrefs[v.id] || 'EXACT'
                    const isAdding = addingVariantId === v.id
                    const isJustAdded = addedVariantId === v.id

                    return (
                      <div
                        key={v.id}
                        className="flex flex-wrap items-end justify-between gap-3 pt-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-brand-950">
                              {v.brand} ({v.pack_quantity} {v.pack_unit} sealed pack)
                            </span>
                            <span className="text-xs text-slate-600">
                              SKU: {v.sku}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Retail Ref:</span>
                            <span className="font-semibold text-slate-700">
                              {formatCurrency(v.reference_retail_price)} / pack
                            </span>
                          </div>

                          {/* Brand Preference Selection */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-slate-500">Brand match:</span>
                            <button
                              type="button"
                              aria-pressed={pref === 'EXACT'}
                              onClick={() => handleBrandPrefChange(v.id, 'EXACT')}
                              className={`min-h-10 rounded-lg border px-2 text-sm font-medium ${
                                pref === 'EXACT'
                                  ? 'bg-brand-50 border-brand-600 text-brand-700'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              Exact Brand Only
                            </button>
                            <button
                              type="button"
                              aria-pressed={pref === 'FLEXIBLE'}
                              onClick={() => handleBrandPrefChange(v.id, 'FLEXIBLE')}
                              title="Allow equivalent quality brand to achieve maximum wholesale pool discount"
                              className={`min-h-10 rounded-lg border px-2 text-sm font-medium flex items-center gap-1 ${
                                pref === 'FLEXIBLE'
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              Flexible brand
                            </button>
                          </div>
                        </div>

                        {/* Quantity and Add Button */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Pack Stepper */}
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              type="button"
                              aria-label={`Remove one pack of ${v.brand}`}
                              onClick={() => handleQuantityChange(v.id, -1)}
                              disabled={qty <= 1}
                              className="quantity-button"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 text-center text-xs font-bold text-slate-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one pack of ${v.brand}`}
                              onClick={() => handleQuantityChange(v.id, 1)}
                              className="quantity-button"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <Button
                            size="sm"
                            variant={isJustAdded ? 'success' : 'primary'}
                            onClick={() => handleAddToList(v)}
                            isLoading={isAdding}
                            disabled={!!addingVariantId}
                            className="text-xs shrink-0 min-w-[110px]"
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Added!
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                                Add {qty} Pack{qty > 1 ? 's' : ''}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-[11px] text-slate-500">
            Added items are saved privately to your household grocery list.
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Done Browsing
          </Button>
        </div>
      </div>
    </Modal>
  )
}
