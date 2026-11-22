import React, { useState } from 'react'
import { ShoppingBag, MapPin, User, LogOut, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onOpenDemoSwitcher: () => void
  currentView: string
  onNavigate: (view: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenDemoSwitcher,
  currentView,
  onNavigate,
}) => {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleMobileNav = (view: string) => {
    onNavigate(view)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Neighborhood selector */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
                  BULK<span className="text-brand-600">SHARE</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-medium tracking-wide">
                  Group Grocery Buying
                </span>
              </div>
            </button>

            {/* Neighborhood Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>{user?.neighborhood?.name || 'Indiranagar Central'}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{user?.neighborhood?.postal_code || '560038'}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'landing'
                  ? 'text-brand-700 bg-brand-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('groups-preview')}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Neighborhood Groups
            </button>
            <button
              onClick={() => onNavigate('savings-calculator')}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Wholesale Pricing
            </button>
          </nav>

          {/* User & Auth actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Evaluator Role Switcher Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDemoSwitcher}
              className="border-brand-300 bg-brand-50/70 text-brand-900 text-xs font-semibold hover:bg-brand-100"
            >
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse mr-1" />
              Demo Roles
              <ChevronDown className="w-3 h-3 text-brand-600 ml-0.5" />
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('dashboard')}
                  className="gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {user.role === 'ADMIN'
                      ? 'Admin Console'
                      : user.role === 'SUPPLIER'
                      ? 'Wholesaler Portal'
                      : 'Dashboard'}
                  </span>
                </Button>

                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900 leading-none">{user.full_name}</p>
                    <Badge variant={user.role === 'ADMIN' ? 'warning' : user.role === 'SUPPLIER' ? 'info' : 'brand'} className="mt-1 text-[10px] py-0 px-1.5">
                      {user.role}
                    </Badge>
                  </div>
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAuth('login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenAuth('register')}
                >
                  Get Started
                </Button>
              </div>
            )}
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-hidden"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{user?.neighborhood?.name || 'Indiranagar Central'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{user?.neighborhood?.postal_code || '560038'}</span>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              onClick={() => handleMobileNav('landing')}
              className={`px-3 py-2 text-left rounded-lg text-sm font-medium transition-colors ${
                currentView === 'landing'
                  ? 'text-brand-700 bg-brand-50 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => handleMobileNav('groups-preview')}
              className="px-3 py-2 text-left rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Neighborhood Groups
            </button>
            <button
              onClick={() => handleMobileNav('savings-calculator')}
              className="px-3 py-2 text-left rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Wholesale Pricing
            </button>
          </nav>

          {user && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleMobileNav('dashboard')}
                className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Open Dashboard ({user.role})
              </button>
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
