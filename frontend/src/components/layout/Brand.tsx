import { ShoppingBag } from 'lucide-react'

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-extrabold tracking-[-.04em]">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${inverse ? 'bg-limewash text-brand-950' : 'bg-brand-800 text-white'}`}>
        <ShoppingBag aria-hidden="true" className="size-[18px]" strokeWidth={2} />
      </span>
      <span className={inverse ? 'text-white' : 'text-brand-950'}>BULK</span>
      <span className={`-ml-1.5 ${inverse ? 'text-limewash' : 'text-brand-700'}`}>SHARE</span>
    </span>
  )
}
