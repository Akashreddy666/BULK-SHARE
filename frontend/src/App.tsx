import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AuthModal } from '@/components/auth/AuthModal'
import { DemoRoleSwitcher } from '@/components/auth/DemoRoleSwitcher'
import { LandingPage } from '@/pages/LandingPage'
import { CustomerDashboard } from '@/pages/dashboards/CustomerDashboard'
import { OrganizerDashboard } from '@/pages/dashboards/OrganizerDashboard'
import { SupplierDashboard } from '@/pages/dashboards/SupplierDashboard'
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard'

const AppContent: React.FC = () => {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing')
  const [navigation, setNavigation] = useState({ target: '', sequence: 0 })
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false)
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login')
  const [demoSwitcherOpen, setDemoSwitcherOpen] = useState<boolean>(false)

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthInitialMode(mode)
    setAuthModalOpen(true)
  }

  const handleOpenDemoSwitcher = () => {
    setDemoSwitcherOpen(true)
  }

  const handleNavigate = (target: string) => {
    setCurrentView(target === 'dashboard' ? 'dashboard' : 'landing')
    setNavigation((previous) => ({ target, sequence: previous.sequence + 1 }))
  }

  useEffect(() => {
    if (!navigation.target) return
    const element = document.getElementById(navigation.target)
    if (element) {
      element.focus({ preventScroll: true })
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    } else {
      window.scrollTo({ top: 0 })
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
  }, [navigation])

  const openDashboard = () => handleNavigate('dashboard')

  const renderDashboard = () => {
    if (!user) {
      return (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onOpenDemoSwitcher={handleOpenDemoSwitcher}
          onNavigateToDashboard={openDashboard}
        />
      )
    }

    // Role-based routing
    if (user.role === 'ADMIN') {
      return <AdminDashboard onOpenDemoSwitcher={handleOpenDemoSwitcher} />
    }
    if (user.role === 'SUPPLIER') {
      return <SupplierDashboard onOpenDemoSwitcher={handleOpenDemoSwitcher} />
    }
    // Check if organizer persona
    if (user.email.includes('organizer')) {
      return <OrganizerDashboard onOpenDemoSwitcher={handleOpenDemoSwitcher} />
    }
    return <CustomerDashboard onOpenDemoSwitcher={handleOpenDemoSwitcher} />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only z-50 rounded-xl bg-white px-4 py-3 font-bold text-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to content</a>
      <DemoBanner />
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenDemoSwitcher={handleOpenDemoSwitcher}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {currentView === 'dashboard' ? (
          renderDashboard()
        ) : (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onOpenDemoSwitcher={handleOpenDemoSwitcher}
            onNavigateToDashboard={user ? openDashboard : undefined}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onOpenDemoSwitcher={handleOpenDemoSwitcher}
        onSuccess={openDashboard}
      />

      {/* Evaluator Demo Role Switcher */}
      <DemoRoleSwitcher
        isOpen={demoSwitcherOpen}
        onClose={() => setDemoSwitcherOpen(false)}
        onNavigateToDashboard={openDashboard}
      />
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
