import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

const date = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

export function formatCurrency(value: number) {
  return currency.format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const instant = new Date(value)
  return Number.isNaN(instant.getTime()) ? '—' : date.format(instant)
}
