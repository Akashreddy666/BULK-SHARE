import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/services/supabase'
import { UserRole } from '@/types'
import { Sparkles } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onOpenDemoSwitcher: () => void
  onSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onOpenDemoSwitcher,
  onSuccess,
}) => {
  const { loginWithPassword, registerWithPassword, loginWithGoogle, isLoading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('CUSTOMER')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  const openDemoRoles = () => {
    onClose()
    onOpenDemoSwitcher()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Please enter email and password.')
      return
    }

    try {
      if (mode === 'login') {
        await loginWithPassword(email, password)
      } else {
        if (!fullName.trim()) {
          setErrorMessage('Please enter your full name.')
          return
        }
        const result = await registerWithPassword(email, password, fullName.trim(), role)
        if (result === 'confirm-email') {
          setPassword('')
          setNeedsEmailConfirmation(true)
          return
        }
      }
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Sign in to BULK SHARE"
        description="This demo uses sample accounts. Choose a persona to open its dashboard."
      >
        <Button onClick={openDemoRoles} className="w-full">
          <Sparkles aria-hidden="true" className="size-4" /> Continue with demo roles
        </Button>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Sign in to BULK SHARE' : 'Join BULK SHARE'}
      description={
        mode === 'login'
          ? 'Enter your credentials or test with an evaluator persona.'
          : 'Start pooling grocery purchases with your neighbors.'
      }
    >
      <div className="space-y-4">
        {/* Mode Switcher Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => { setMode('login'); setErrorMessage(null); setNeedsEmailConfirmation(false); }}
            className={`min-h-11 flex-1 rounded-lg text-sm transition-colors ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            aria-pressed={mode === 'register'}
            onClick={() => { setMode('register'); setErrorMessage(null); setNeedsEmailConfirmation(false); }}
            className={`min-h-11 flex-1 rounded-lg text-sm transition-colors ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {needsEmailConfirmation ? (
          <div className="space-y-3">
            <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
              Check your email for the confirmation link, then return here to sign in.
            </p>
            <Button onClick={() => { setMode('login'); setNeedsEmailConfirmation(false) }}>Back to sign in</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <Input
                  label="Full Name"
                  autoComplete="name"
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={role === 'CUSTOMER'}
                      onClick={() => setRole('CUSTOMER')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all ${
                        role === 'CUSTOMER'
                          ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-semibold block">Household Customer</span>
                      <span className="text-[10px] text-slate-500">Join neighborhood groups</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={role === 'SUPPLIER'}
                      onClick={() => setRole('SUPPLIER')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all ${
                        role === 'SUPPLIER'
                          ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-semibold block">Wholesaler Supplier</span>
                      <span className="text-[10px] text-slate-500">Provide quotes & bulk supply</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        )}

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-2 text-xs text-slate-400">or continue with</span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-center text-xs"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Evaluator Quick Persona Switcher shortcut */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={openDemoRoles}
            className="text-xs text-brand-700 hover:text-brand-800 font-medium flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Evaluating this project? Try One-Click Demo Personas
          </button>
        </div>
      </div>
    </Modal>
  )
}
