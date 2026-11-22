import React, { useState, useEffect } from 'react'
import { Plus, Users, Calendar, MapPin, Lock, Globe, AlertCircle } from 'lucide-react'
import { Neighborhood, CreateGroupInput, BuyingGroup } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (group: BuyingGroup) => void
  defaultNeighborhoodId?: string | null
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultNeighborhoodId,
}) => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [neighborhoodId, setNeighborhoodId] = useState(defaultNeighborhoodId || '')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [minMembers, setMinMembers] = useState(5)
  const [deadlineDays, setDeadlineDays] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      api.getNeighborhoods()
        .then((data) => {
          setNeighborhoods(data)
          if (!neighborhoodId && data.length > 0) {
            setNeighborhoodId(defaultNeighborhoodId || data[0].id)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, defaultNeighborhoodId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter a group name')
      return
    }

    if (!neighborhoodId) {
      setError('Please select a neighborhood')
      return
    }

    setIsSubmitting(true)

    try {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + Number(deadlineDays))
      deadline.setHours(20, 0, 0, 0) // default 8 PM

      const payload: CreateGroupInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        neighborhood_id: neighborhoodId,
        visibility,
        min_members: Number(minMembers),
        deadline: deadline.toISOString(),
      }

      const created = await api.createGroup(payload)
      onSuccess(created)
      onClose()
      setName('')
      setDescription('')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to create buying group. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Neighborhood Buying Group"
      description="Gather neighbors to unlock wholesale quantity pricing on grocery staples."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="buying-group-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Group Name *
          </label>
          <Input
            id="buying-group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 100ft Road Grocery Club"
            required
          />
        </div>

        <div>
          <label htmlFor="buying-group-description" className="block text-xs font-semibold text-slate-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="buying-group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify apartment wing, schedule, or preferences (e.g. Sona Masoori Rice & Cold Pressed Oil)"
            rows={2}
            className="control w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="buying-group-neighborhood" className="block text-xs font-semibold text-slate-700 mb-1">
              Neighborhood *
            </label>
            <div className="relative">
              <select
                id="buying-group-neighborhood"
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
                className="control w-full"
                required
              >
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.postal_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="buying-group-minimum" className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Households *
            </label>
            <Input
              id="buying-group-minimum"
              type="number"
              min={2}
              max={50}
              value={minMembers}
              onChange={(e) => setMinMembers(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="buying-group-deadline" className="block text-xs font-semibold text-slate-700 mb-1">
            Group Closes In (Order Cutoff)
          </label>
          <select
            id="buying-group-deadline"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(Number(e.target.value))}
            className="control w-full"
          >
            <option value={3}>3 Days (Fast Pool)</option>
            <option value={5}>5 Days</option>
            <option value={7}>7 Days (Recommended Weekly)</option>
            <option value={14}>14 Days (Monthly Bulk)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Group Privacy & Visibility
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('PUBLIC')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                visibility === 'PUBLIC'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-900'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Globe className="w-3.5 h-3.5 text-brand-600" />
                Public Pool
              </div>
              <p className="text-[11px] text-slate-500">
                Any verified neighbor in {neighborhoods.find((n) => n.id === neighborhoodId)?.name || 'the area'} can view and join.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('PRIVATE')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                visibility === 'PRIVATE'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-900'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Lock className="w-3.5 h-3.5 text-brand-600" />
                Private Group
              </div>
              <p className="text-[11px] text-slate-500">
                Hidden from public search. Accessible only via invitation token or link you share.
              </p>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}
