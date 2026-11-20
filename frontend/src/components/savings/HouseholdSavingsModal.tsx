import React, { useState, useEffect } from 'react'
import { HouseholdSavingsResponse } from '@/types'
import { api } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { SavingsBreakdownCard } from '@/components/savings/SavingsBreakdownCard'

interface HouseholdSavingsModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
}

export const HouseholdSavingsModal: React.FC<HouseholdSavingsModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
}) => {
  const [savings, setSavings] = useState<HouseholdSavingsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && groupId) {
      setIsLoading(true)
      setError(null)
      api
        .getMySavings(groupId)
        .then((data) => setSavings(data))
        .catch((err) => setError(err.message || 'Failed to calculate household savings'))
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, groupId])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Household Bulk Savings: ${groupName}`} size="lg">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <SavingsBreakdownCard savings={savings} isLoading={isLoading} />
      </div>
    </Modal>
  )
}
