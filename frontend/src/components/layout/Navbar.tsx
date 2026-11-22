import { useRef, useState } from 'react'
import { FlaskConical, LayoutGrid, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Brand } from './Brand'
import { publicNavigation } from './publicNavigation'

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onOpenDemoSwitcher: () => void
  currentView: 'landing' | 'dashboard'
  onNavigate: (target: string) => void
}

export function Navbar({ onOpenAuth, onOpenDemoSwitcher, currentView, onNavigate }: NavbarProps) {
  const { user, logout } = useAuth()
  const mobileMenuToggle = useRef<HTMLButtonElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dashboardLabel = user?.role === 'ADMIN' ? 'Admin console' : user?.role === 'SUPPLIER' ? 'Supplier portal' : 'Dashboard'

  function navigate(target: string) {
    setMobileMenuOpen(false)
    onNavigate(target)
  }

  function signOut() {
    logout()
    navigate('landing')
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileMenuOpen) {
          setMobileMenuOpen(false)
          mobileMenuToggle.current?.focus()
        }
      }}
    >
      <div className="site-container flex h-[4.25rem] items-center justify-between gap-3">
        <button type="button" aria-label="BULK SHARE home" onClick={() => navigate('landing')} className="min-h-11 shrink-0 rounded-lg">
          <Brand />
        </button>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {publicNavigation.map(({ id, label }) => (
            <button key={id} type="button" onClick={() => navigate(id)} className="rounded-lg px-2.5 py-3 text-sm font-semibold text-slate-700 hover:bg-canvas hover:text-brand-800 xl:px-3">
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={onOpenDemoSwitcher}>
            <FlaskConical aria-hidden="true" className="size-4" /> Demo roles
          </Button>
          {user ? (
            <>
              <NotificationBell key={user.id} />
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('dashboard')} aria-current={currentView === 'dashboard' ? 'page' : undefined}>
                <LayoutGrid aria-hidden="true" className="size-4" /> {dashboardLabel}
              </Button>
              <button type="button" title={`Sign out ${user.full_name}`} aria-label="Sign out" onClick={signOut} className="hidden size-11 place-items-center rounded-xl text-slate-600 hover:bg-canvas lg:grid">
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => onOpenAuth('login')}>Sign in</Button>
              <Button size="sm" onClick={() => onOpenAuth('register')}>Get started</Button>
            </>
          )}
          <button
            type="button"
            ref={mobileMenuToggle}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="grid size-11 place-items-center rounded-xl text-ink hover:bg-canvas lg:hidden"
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      <nav id="mobile-navigation" hidden={!mobileMenuOpen} aria-label="Mobile navigation" className="border-t border-line bg-white shadow-panel lg:hidden">
        <div className="site-container space-y-1 py-3">
          {publicNavigation.map(({ id, label }) => (
            <button key={id} type="button" onClick={() => navigate(id)} className="block min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-canvas">
              {label}
            </button>
          ))}
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <Button variant="outline" size="sm" onClick={() => { mobileMenuToggle.current?.focus(); setMobileMenuOpen(false); onOpenDemoSwitcher() }}>Try demo roles</Button>
            {user ? (
              <>
                <Button size="sm" onClick={() => navigate('dashboard')}>{dashboardLabel}</Button>
                <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { mobileMenuToggle.current?.focus(); setMobileMenuOpen(false); onOpenAuth('login') }}>Sign in</Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
