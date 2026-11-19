import { HealthResponse, Neighborhood, User } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('bulkshare_token')
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('bulkshare_token', token)
  } else {
    localStorage.removeItem('bulkshare_token')
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) {
      let detail = `Request failed with status ${res.status}`
      try {
        const errorJson = await res.json()
        detail = errorJson.detail || detail
      } catch {
        // Fallback to text
      }
      throw new ApiError(detail, res.status)
    }
    return (await res.json()) as T
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    const message = err instanceof Error ? err.message : 'Network error connecting to BULK SHARE API'
    throw new ApiError(message, 500)
  }
}

export const api = {
  getHealth: () => request<HealthResponse>('/health'),
  getNeighborhoods: () => request<Neighborhood[]>('/neighborhoods'),
  getMe: () => request<User>('/users/me'),
  updateMe: (data: Partial<Pick<User, 'full_name' | 'phone' | 'neighborhood_id'>>) =>
    request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  demoLogin: (role: string, email?: string) =>
    request<{ access_token: string; user: User; demo_mode: boolean }>('/users/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    }),
}
