import { Brand } from './Brand'
import { publicNavigation } from './publicNavigation'

export function Footer({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="site-container">
        <div className="grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <button type="button" onClick={() => onNavigate('landing')} className="rounded-lg text-lg"><Brand inverse /></button>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">Neighborhood buying groups for the staples your household uses every day.</p>
          </div>
          <nav aria-label="Footer navigation">
            <h2 className="mb-2 font-bold text-white">Explore</h2>
            <ul>
              {[...publicNavigation, { id: 'faq', label: 'Common questions' }].map(({ id, label }) => (
                <li key={id}><button type="button" onClick={() => onNavigate(id)} className="min-h-9 rounded text-left text-sm text-brand-200 hover:text-white hover:underline">{label}</button></li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="mb-3 font-bold text-white">Public demonstration</h2>
            <p className="max-w-xs text-sm leading-relaxed text-brand-200">Catalog prices, supplier quotations, payments and fulfillment are simulated for evaluation.</p>
          </div>
        </div>
        <div className="border-t border-brand-700 py-5 text-sm text-brand-200">© {new Date().getFullYear()} BULK SHARE</div>
      </div>
    </footer>
  )
}
