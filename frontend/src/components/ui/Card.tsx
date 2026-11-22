import React from 'react'
import { cn } from '@/lib/utils'

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'min-w-0 rounded-panel border border-line bg-white shadow-panel',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return <div className={cn('p-4 sm:p-5 border-b border-line', className)} {...props}>{children}</div>
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props}>
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return <p className={cn('text-sm text-slate-600 mt-1', className)} {...props}>{children}</p>
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return <div className={cn('p-4 sm:p-5', className)} {...props}>{children}</div>
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return <div className={cn('rounded-b-panel p-4 sm:p-5 bg-canvas border-t border-line', className)} {...props}>{children}</div>
}
