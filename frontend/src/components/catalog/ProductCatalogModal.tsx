import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Tag,
} from 'lucide-react'
import { Product, ProductVariant, ProductCategory, BrandPreference } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
  const [error, setError] = useState<string | null>(null)

  // Selection states per variant
  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({})
  const [brandPrefs, setBrandPrefs] = useState<Record<string, BrandPreference>>({})
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadCatalog()
    }
  }, [isOpen, selectedCategory])

  const loadCatalog = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getProducts(selectedCategory === 'ALL' ? undefined : selectedCategory)
      setProducts(data)
    } catch {
      setError('Could not load grocery catalog. Please check your network.')
    } finally {
      setIsLoading(false)
    }
  }

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
      setTimeout(() => setAddedVariantId(null), 2000)
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Browse Grocery Catalog"
      description={`Add sealed staple packages to your household list for "${groupName}".`}
      size="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sealed Pack Compliance Notice */}
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Sealed Manufacturer Packs Only:</strong> Factory packaged & tamper-proof. No loose grains or repacking.
            </span>
          </div>
          <Badge variant="success" className="text-[10px] hidden sm:inline-block">100% Sealed</Badge>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Product List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading staple groceries...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No products found in this category.
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">
                      {product.category}
                    </Badge>
                    <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
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
                        className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {v.brand} ({v.pack_quantity} {v.pack_unit} sealed pack)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
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
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-slate-500">Brand match:</span>
                            <button
                              type="button"
                              onClick={() => handleBrandPrefChange(v.id, 'EXACT')}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                pref === 'EXACT'
                                  ? 'bg-brand-50 border-brand-600 text-brand-700'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              Exact Brand Only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBrandPrefChange(v.id, 'FLEXIBLE')}
                              title="Allow equivalent quality brand to achieve maximum wholesale pool discount"
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 ${
                                pref === 'FLEXIBLE'
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              Flexible Equivalent (Best Discount)
                            </button>
                          </div>
                        </div>

                        {/* Quantity and Add Button */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Pack Stepper */}
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(v.id, -1)}
                              disabled={qty <= 1}
                              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 text-center text-xs font-bold text-slate-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(v.id, 1)}
                              className="p-1.5 text-slate-500 hover:text-slate-900"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <Button
                            size="sm"
                            variant={isJustAdded ? 'success' : 'primary'}
                            onClick={() => handleAddToList(v)}
                            isLoading={isAdding}
                            disabled={isAdding}
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

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
