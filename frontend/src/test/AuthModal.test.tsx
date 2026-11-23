import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthModal } from '@/components/auth/AuthModal'
import { AuthProvider } from '@/context/AuthContext'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}))

vi.mock('@/services/supabase', () => ({ supabase: { auth }, isSupabaseConfigured: true }))

function showAuth(mode: 'login' | 'register') {
  const onSuccess = vi.fn()
  render(
    <AuthProvider>
      <AuthModal isOpen initialMode={mode} onClose={vi.fn()} onOpenDemoSwitcher={vi.fn()} onSuccess={onSuccess} />
    </AuthProvider>,
  )
  return onSuccess
}

function enterCredentials() {
  fireEvent.change(screen.getByLabelText('Email address', { exact: false }), { target: { value: 'customer@example.com' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'sample-password' } })
}

describe('Configured account authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    auth.getSession.mockResolvedValue({ data: { session: null } })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('keeps registration open until the user confirms their email', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
    const onSuccess = showAuth('register')
    enterCredentials()
    fireEvent.change(screen.getByLabelText('Full name', { exact: false }), { target: { value: 'Sample Customer' } })

    const submit = screen.getByRole('dialog').querySelector('button[type="submit"]')!
    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)

    expect(await screen.findByText(/Check your email for the confirmation link/i)).toBeVisible()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('keeps sign-in open when FastAPI cannot load the authenticated profile', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'sample-access-token' } }, error: null })
    const fetchProfile = vi.fn().mockResolvedValue(new Response(null, { status: 502 }))
    vi.stubGlobal('fetch', fetchProfile)
    const onSuccess = showAuth('login')
    enterCredentials()
    const submit = screen.getByRole('dialog').querySelector('button[type="submit"]')!
    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(/local backend|API is unavailable/i)
    expect(fetchProfile).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({
      headers: expect.any(Headers),
    }))
    expect(fetchProfile.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer sample-access-token')
    expect(localStorage.getItem('bulkshare_token')).toBeNull()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
