import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/services/api'
import type { Product, SupplierProductOffer, SupplierProfile } from '@/types'

export function SupplierProfileForm({ profile, name, onClose, onSave }: {
  profile: SupplierProfile | null
  name: string
  onClose: () => void
  onSave: (profile: SupplierProfile) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = {
      company_name: String(form.get('company')).trim(),
      city: String(form.get('city')).trim(),
      description: String(form.get('description')).trim(),
    }
    if (!data.company_name || !data.city) {
      setError('Enter the business name and city.')
      return
    }
    setError('')
    setBusy(true)
    try {
      onSave(await (profile ? api.updateSupplierProfile(data) : api.createSupplierProfile(data)))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The supplier profile could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose() }} title={profile ? 'Edit supplier profile' : 'Set up supplier profile'}>
      <form onSubmit={save} className="space-y-4">
        <Input label="Business name" name="company" defaultValue={profile?.company_name ?? name} required maxLength={140} />
        <Input label="City" name="city" defaultValue={profile?.city ?? ''} required maxLength={100} />
        <div>
          <label htmlFor="supplier-description" className="mb-1.5 block text-sm font-semibold">Business description</label>
          <textarea id="supplier-description" name="description" defaultValue={profile?.description ?? ''} className="control w-full" rows={3} maxLength={1000} />
        </div>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" isLoading={busy}>Save profile</Button>
        </div>
      </form>
    </Modal>
  )
}

export function SupplierOfferForm({ offer, onClose, onSave }: {
  offer: SupplierProductOffer | null
  onClose: () => void
  onSave: (offer: SupplierProductOffer) => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(!offer)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (offer) return
    let current = true
    api.getProducts()
      .then((results) => { if (current) setProducts(results) })
      .catch(() => { if (current) setError('The product catalog could not be loaded. Close this dialog and try again.') })
      .finally(() => { if (current) setLoadingCatalog(false) })
    return () => { current = false }
  }, [offer])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const max = form.get('max')
    const data = {
      offer_price_per_pack: Number(form.get('price')),
      min_order_packs: Number(form.get('min')),
      max_order_packs: max ? Number(max) : null,
    }
    if (data.max_order_packs !== null && data.max_order_packs < data.min_order_packs) {
      setError('Maximum packs must be at least the minimum quantity.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = offer
        ? await api.updateSupplierOffer(offer.id, { ...data, is_active: form.has('active') })
        : await api.createSupplierOffer({ ...data, variant_id: String(form.get('variant')) })
      const variant = products.flatMap((product) => product.variants.map((item) => ({ product, item })))
        .find(({ item }) => item.id === saved.variant_id)
      const variantLabel = variant ? `${variant.product.name} · ${variant.item.brand} · ${variant.item.pack_quantity} ${variant.item.pack_unit}` : offer?.variant_display_name
      onSave({ ...saved, variant_display_name: saved.variant_display_name ?? variantLabel })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The wholesale offer could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose() }} title={offer ? 'Edit wholesale offer' : 'Add wholesale offer'} description={offer?.variant_display_name ?? 'Set a price and minimum quantity for a sealed pack.'}>
      <form onSubmit={save} className="space-y-4">
        {!offer && (
          <div>
            <label htmlFor="offer-variant" className="mb-1.5 block text-sm font-semibold">Catalog pack</label>
            <select id="offer-variant" name="variant" className="control w-full" required defaultValue="" disabled={loadingCatalog}>
              <option value="">{loadingCatalog ? 'Loading catalog…' : 'Choose a pack'}</option>
              {products.map((product) => (
                <optgroup key={product.id} label={product.name}>
                  {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.brand} · {variant.pack_quantity} {variant.pack_unit}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        <Input label="Price per pack (₹)" name="price" type="number" step=".01" min=".01" defaultValue={offer?.offer_price_per_pack} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Minimum packs" name="min" type="number" min="1" defaultValue={offer?.min_order_packs ?? 1} required />
          <Input label="Maximum packs (optional)" name="max" type="number" min="1" defaultValue={offer?.max_order_packs ?? ''} />
        </div>
        {offer && <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="active" className="size-4 accent-brand-700" defaultChecked={offer.is_active} /> Active offer</label>}
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" isLoading={busy} disabled={loadingCatalog}>Save offer</Button>
        </div>
      </form>
    </Modal>
  )
}
