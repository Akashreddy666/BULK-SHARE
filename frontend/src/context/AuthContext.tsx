import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, UserRole } from '@/types'
import { api, getStoredToken, setStoredToken } from '@/services/api'
import { supabase, isSupabaseConfigured } from '@/services/supabase'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  demoMode: boolean
  loginWithPassword: (email: string, password: string) => Promise<void>
  registerWithPassword: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  loginWithGoogle: () => Promise<void>
  demoLogin: (role: UserRole, email?: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<Pick<User, 'full_name' | 'phone' | 'neighborhood_id'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  const refreshProfile = async () => {
    try {
      const profile = await api.getMe()
      setUser(profile)
    } catch {
      // Token expired or invalid
      setStoredToken(null)
      setToken(null)
      setUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      const stored = getStoredToken()
      if (stored) {
        try {
          const profile = await api.getMe()
          setUser(profile)
        } catch {
          setStoredToken(null)
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const loginWithPassword = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (sbError) throw sbError
        if (data.session?.access_token) {
          setStoredToken(data.session.access_token)
          setToken(data.session.access_token)
          await refreshProfile()
        }
      } else {
        // Fallback in demo mode
        await demoLogin('CUSTOMER', email)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const registerWithPassword = async (email: string, _password: string, fullName: string, role: UserRole) => {
    setIsLoading(true)
    setError(null)
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: sbError } = await supabase.auth.signUp({
          email,
          password: _password,
          options: {
            data: { full_name: fullName, role },
          },
        })
        if (sbError) throw sbError
        if (data.session?.access_token) {
          setStoredToken(data.session.access_token)
          setToken(data.session.access_token)
          await refreshProfile()
        }
      } else {
        // In demo mode: create/login
        await demoLogin(role, email)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
    } else {
      // Demo simulated Google sign-in
      await demoLogin('CUSTOMER', 'priya.customer@bulkshare.com')
    }
  }

  const demoLogin = async (role: UserRole, email?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.demoLogin(role, email)
      setStoredToken(res.access_token)
      setToken(res.access_token)
      setUser(res.user)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo login failed'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {})
    }
    setStoredToken(null)
    setToken(null)
    setUser(null)
  }

  const updateProfile = async (data: Partial<Pick<User, 'full_name' | 'phone' | 'neighborhood_id'>>) => {
    const updated = await api.updateMe(data)
    setUser(updated)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        demoMode,
        loginWithPassword,
        registerWithPassword,
        loginWithGoogle,
        demoLogin,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
