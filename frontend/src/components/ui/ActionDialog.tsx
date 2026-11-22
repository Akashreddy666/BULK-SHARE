import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

export interface PendingAction {
  title: string
  description: string
  label: string
  run: () => Promise<void>
}

export function ActionDialog({ action, onClose }: { action: PendingAction | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setError('') }, [action])

  async function confirm() {
    if (!action || busy) return
    setBusy(true)
    setError('')
    try {
      await action.run()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'That action could not be completed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={!!action} onClose={() => { if (!busy) onClose() }} title={action?.title} description={action?.description} size="sm">
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button isLoading={busy} onClick={confirm}>{action?.label}</Button>
      </div>
    </Modal>
  )
}
