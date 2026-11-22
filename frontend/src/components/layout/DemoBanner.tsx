import { Info } from 'lucide-react'

export function DemoBanner() {
  return (
    <aside aria-label="Demonstration notice" className="bg-brand-900 text-white">
      <div className="site-container flex items-start justify-center gap-2 py-2 text-xs leading-relaxed sm:items-center sm:text-sm">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-limewash sm:mt-0" />
        <p>
          <strong className="mr-2 font-bold text-limewash">Public demo mode</strong>
          <span>Sample grocery data &amp; simulated transactions only.</span>
        </p>
      </div>
    </aside>
  )
}
