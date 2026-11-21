import React, { useState } from 'react'
import { X, AlertTriangle, Send } from 'lucide-react'
import { api } from '@/services/api'
import { DisputeCategory } from '@/types'
import { Button } from '@/components/ui/Button'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  groupOrderId: string
  onDisputeSubmitted?: () => void
}

const CATEGORIES: { label: string; value: DisputeCategory; desc: string }[] = [
  {
    label: 'Damaged Packaging / Torn Seal',
    value: 'DAMAGED_PACKS',
    desc: 'Outer seal broken, leaking sack, punctured grain package',
  },
  {
    label: 'Missing Items or Sacks',
    value: 'MISSING_ITEMS',
    desc: 'Received fewer packs than confirmed in allocation',
  },
  {
    label: 'Wrong Product or Variant',
    value: 'WRONG_ITEM',
    desc: 'Received incorrect grain brand, flour type, or package size',
  },
  {
    label: 'Delivery / Pickup Issue',
    value: 'DELIVERY_ISSUE',
    desc: 'Delay, wrong drop location, or neighborhood hub collection issue',
  },
  {
    label: 'Other Quality Concern',
    value: 'OTHER',
    desc: 'Any other issue regarding products or fulfillment',
  },
]

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  groupOrderId,
  onDisputeSubmitted,
}) => {
  const [category, setCategory] = useState<DisputeCategory>('DAMAGED_PACKS')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please provide details explaining the issue.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await api.createDispute(groupOrderId, {
        category,
        description: description.trim(),
      })
      setSuccess(true)
      if (onDisputeSubmitted) {
        onDisputeSubmitted()
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit dispute. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Report an Issue or Dispute</h2>
              <p className="text-xs text-slate-500">Order claim resolution with Platform Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dispute Ticket Logged</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your report has been submitted to the platform administrator. You will receive an
                in-app notification when the review is complete.
              </p>
              <Button size="sm" onClick={onClose} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Issue Category
                </label>
                <div className="space-y-2">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        category === c.value
                          ? 'border-brand-600 bg-brand-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={c.value}
                        checked={category === c.value}
                        onChange={() => setCategory(c.value)}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 block">{c.label}</span>
                        <span className="text-[11px] text-slate-500">{c.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what went wrong (e.g., package brand received, torn sack condition, missing weight)..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
