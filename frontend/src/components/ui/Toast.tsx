import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

type Notify = (message: string, tone?: 'success' | 'error') => void
const ToastContext = createContext<Notify>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' }>()
  const timer = useRef<number | undefined>(undefined)
  const notify = useCallback<Notify>((message, tone = 'success') => {
    window.clearTimeout(timer.current)
    setNotice({ message, tone })
    if (tone === 'success') timer.current = window.setTimeout(() => setNotice(undefined), 5500)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 ml-auto max-w-sm">
        {notice && (
          <div role={notice.tone === 'error' ? 'alert' : 'status'} className="page-enter pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold shadow-overlay">
            {notice.tone === 'error' ? <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-red-700" /> : <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-brand-700" />}
            <p className="min-w-0 flex-1 break-words">{notice.message}</p>
            <button type="button" onClick={() => setNotice(undefined)} aria-label="Dismiss notification" className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-canvas">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
