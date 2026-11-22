import type { ReactNode } from 'react'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function Dashboard({ children }: { children: ReactNode }) {
  return <div className="site-container page-enter space-y-6 py-7 sm:space-y-8 sm:py-10">{children}</div>
}

export function DashboardHeader({ role, title, description, icon: Icon, children }: {
  role: string
  title: string
  description: ReactNode
  icon: LucideIcon
  children?: ReactNode
}) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] bg-brand-900 p-6 text-white sm:p-8">
      <Icon aria-hidden="true" strokeWidth={.8} className="pointer-events-none absolute -right-5 -top-10 size-56 rotate-12 text-brand-700/60" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-sm font-bold text-limewash">{role}</p>
          <h1 className="mt-2 break-words font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] tracking-tight">{title}</h1>
          <div className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base">{description}</div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}

export function Metric({ label, value, caption, icon: Icon }: {
  label: string
  value: ReactNode
  caption?: string
  icon: LucideIcon
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="icon-tile"><Icon aria-hidden="true" className="size-5" /></span>
        <dl className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">{label}</dt>
          <dd className="mt-1 break-words text-xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-2xl">{value}</dd>
        </dl>
      </div>
      {caption && <p className="mt-3 text-sm leading-snug text-slate-600">{caption}</p>}
    </Card>
  )
}

export function DashboardNav<T extends string>({ label, items, value, onChange }: {
  label: string
  items: ReadonlyArray<{ id: T; label: string; icon: LucideIcon }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <nav aria-label={label} className="flex min-w-0 flex-wrap gap-1.5">
      {items.map(({ id, label: text, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={value === id ? 'page' : undefined}
          onClick={() => onChange(id)}
          className={cn('inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors', value === id ? 'bg-brand-800 text-white' : 'text-brand-900 hover:bg-brand-50')}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" /> {text}
        </button>
      ))}
    </nav>
  )
}

export function PanelLoading({ label = 'Loading', count = 3 }: { label?: string; count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="animate-pulse space-y-3 rounded-panel border border-line bg-white p-5">
            <div className="size-10 rounded-xl bg-brand-50" />
            <div className="h-4 w-2/3 rounded bg-brand-50" />
            <div className="h-3 w-full rounded bg-canvas" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <AlertCircle aria-hidden="true" className="size-5 shrink-0" />
      <p className="mr-auto font-medium">{message}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
