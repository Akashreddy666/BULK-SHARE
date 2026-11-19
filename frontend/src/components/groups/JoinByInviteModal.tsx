import React, { useState } from 'react'
import { KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { BuyingGroup } from '@/types'
import { api, ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface JoinByInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (group: BuyingGroup) => void
}

export const JoinByInviteModal: React.FC<JoinByInviteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joinedGroup, setJoinedGroup] = useState<BuyingGroup | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token.trim()) {
      setError('Please paste or enter the invitation code')
      return
    }

    setIsSubmitting(true)

    try {
      const group = await api.redeemInvitation(token.trim())
      setJoinedGroup(group)
      onSuccess(group)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to redeem invitation. Please verify the code.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setToken('')
    setError(null)
    setJoinedGroup(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Join Private Buying Group"
      description="Enter the invitation token received from your apartment organizer or neighbor."
      size="sm"
    >
      {joinedGroup ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Successfully Joined!</h3>
            <p className="text-xs text-slate-600 mt-1">
              You are now a member of <span className="font-semibold">{joinedGroup.name}</span>.
            </p>
          </div>
          <Button size="sm" onClick={handleClose} className="w-full">
            Open Group & Add Groceries
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invitation Code *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="e.g., BS-88A01DFB8A92"
                className="pl-9 font-mono uppercase tracking-wider"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Invitation codes are formatted like <code className="bg-slate-100 px-1 py-0.5 rounded">BS-XXXXXXXXXXXX</code>.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Join Group
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
