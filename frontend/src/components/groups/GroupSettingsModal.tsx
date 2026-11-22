import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/services/api'
import type { BuyingGroup } from '@/types'

export function GroupSettingsModal({ group, onClose, onSave }: {
  group: BuyingGroup
  onClose: () => void
  onSave: (group: BuyingGroup) => void
}) {
  const initialDate = new Date(group.deadline)
  const localDeadline = new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const deadline = String(data.get('deadline'))
    if (!name || (deadline !== localDeadline && new Date(deadline).getTime() <= Date.now())) {
      setError('Enter a group name and a future deadline.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = await api.updateGroup(group.id, {
        name,
        description: String(data.get('description')).trim(),
        ...(deadline !== localDeadline ? { deadline: new Date(deadline).toISOString() } : {}),
      })
      onSave(updated)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save group settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={() => { if (!saving) onClose() }} title="Edit buying group" description="Update the public description and order cutoff for this group.">
      <form className="space-y-4" onSubmit={save}>
        <Input name="name" label="Group name" defaultValue={group.name} required maxLength={120} />
        <div>
          <label htmlFor="group-settings-description" className="mb-1.5 block text-sm font-semibold">Description</label>
          <textarea id="group-settings-description" name="description" defaultValue={group.description ?? ''} rows={3} maxLength={1000} className="control w-full" />
        </div>
        <Input name="deadline" label="Order cutoff" type="datetime-local" defaultValue={localDeadline} helperText="Time shown in your device’s time zone." required />
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" isLoading={saving}>Save settings</Button>
        </div>
      </form>
    </Modal>
  )
}
