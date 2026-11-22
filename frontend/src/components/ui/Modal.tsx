import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const widths = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, title, description, children, className, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !isOpen) return

    if (typeof dialog.showModal !== 'function') {
      dialog.setAttribute('open', '')
      return () => dialog.removeAttribute('open')
    }

    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      aria-label={title ? undefined : 'Dialog'}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn('dialog-enter m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-panel border border-line bg-white p-0 text-ink shadow-overlay sm:max-h-[calc(100dvh-3rem)]', widths[size], className)}
    >
      <div>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="self-center">
            {title && <h2 id={titleId} className="text-lg font-bold leading-tight">{title}</h2>}
            {description && <p id={descriptionId} className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-canvas hover:text-ink"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </dialog>
  )
}
