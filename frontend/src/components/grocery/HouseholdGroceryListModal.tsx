import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Lock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { HouseholdGroceryList, GroceryListItem, BrandPreference } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface HouseholdGroceryListModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  onOpenCatalog: () => void
}

export const HouseholdGroceryListModal: React.FC<HouseholdGroceryListModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  onOpenCatalog,
}) => {
  const [listData, setListData] = useState<HouseholdGroceryList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadMyItems()
    }
  }, [isOpen, groupId])

  const loadMyItems = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getMyGroceryItems(groupId)
      setListData(data)
    } catch {
      setError('Failed to fetch your household grocery items.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuantity = async (item: GroceryListItem, delta: number) => {
    const newQty = item.pack_quantity + delta
    if (newQty < 1) return

    setUpdatingItemId(item.id)
    setError(null)
    try {
      await api.updateGroceryItem(groupId, item.id, { pack_quantity: newQty })
      await loadMyItems()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Could not update pack quantity.')
      }
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleUpdatePreference = async (item: GroceryListItem, pref: BrandPreference) => {
    if (item.brand_preference === pref) return

    setUpdatingItemId(item.id)
    setError(null)
    try {
      await api.updateGroceryItem(groupId, item.id, { brand_preference: pref })
      await loadMyItems()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Could not update brand preference.')
      }
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await api.deleteGroceryItem(groupId, itemId)
      await loadMyItems()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Could not delete item.')
      }
    } finally {
      setUpdatingItemId(null)
    }
  }

  const items = listData?.items || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Household Grocery List"
      description={`Committed sealed packs for "${groupName}".`}
      size="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Strict Household Privacy Notice (FR-LIST-04) */}
        <div className="p-3 rounded-xl bg-slate-900 text-white flex items-start gap-3 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold text-white flex items-center gap-1.5">
              Household Privacy Protected (FR-LIST-04)
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Your grocery items and quantities are strictly private. The group organizer and other neighbors can only view anonymous aggregated demand totals.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading your grocery list...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Your List is Empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add rice, cooking oil, pulses, sugar, or flour to join the neighborhood volume pool.
              </p>
            </div>
            <Button size="sm" onClick={onOpenCatalog}>
              <Plus className="w-4 h-4 mr-1.5" />
              Browse Grocery Catalog
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {items.map((item) => {
              const variant = item.variant
              const isBusy = updatingItemId === item.id
              const itemTotal = item.estimated_item_retail_total || 0

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isBusy ? 'opacity-50 pointer-events-none' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {variant?.brand} {variant?.pack_quantity} {variant?.pack_unit}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {variant?.sku}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                      Ref. Retail: {formatCurrency(variant?.reference_retail_price || 0)} per pack
                    </p>

                    {/* Preference toggle */}
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400">Brand Mode:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdatePreference(item, 'EXACT')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.brand_preference === 'EXACT'
                            ? 'bg-slate-100 border-slate-400 text-slate-800'
                            : 'border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Exact Brand
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePreference(item, 'FLEXIBLE')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${
                          item.brand_preference === 'FLEXIBLE'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        Flexible
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        disabled={item.pack_quantity <= 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.pack_quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total cost */}
                    <div className="text-right min-w-[80px]">
                      <span className="text-[10px] text-slate-400 block">Est. Retail</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-slate-500">
                Committed:{' '}
                <span className="font-bold text-slate-900">
                  {listData?.total_packs} Sealed Pack{listData?.total_packs === 1 ? '' : 's'}
                </span>
              </p>
              <p className="text-slate-500 mt-0.5">
                Reference Retail Total:{' '}
                <span className="font-bold text-slate-900">
                  {formatCurrency(listData?.total_reference_retail_price || 0)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onOpenCatalog}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add More Items
              </Button>
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
