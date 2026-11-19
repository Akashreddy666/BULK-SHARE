import React, { useState } from 'react'
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
  const [currentView, setCurrentView] = useState<string>('landing')
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

  const handleNavigate = (view: string) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderDashboard = () => {
    if (!user) {
      return (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onOpenDemoSwitcher={handleOpenDemoSwitcher}
          onNavigateToDashboard={() => setCurrentView('dashboard')}
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <DemoBanner />
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenDemoSwitcher={handleOpenDemoSwitcher}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      <main className="flex-1">
        {currentView === 'dashboard' ? (
          renderDashboard()
        ) : (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onOpenDemoSwitcher={handleOpenDemoSwitcher}
            onNavigateToDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onOpenDemoSwitcher={handleOpenDemoSwitcher}
        onSuccess={() => setCurrentView('dashboard')}
      />

      {/* Evaluator Demo Role Switcher */}
      <DemoRoleSwitcher
        isOpen={demoSwitcherOpen}
        onClose={() => setDemoSwitcherOpen(false)}
        onNavigateToDashboard={() => setCurrentView('dashboard')}
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
