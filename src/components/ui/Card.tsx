import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className }: CardProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card', className)}>
      {children}
    </div>
  )
}

function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('border-b border-gray-100 px-6 py-4', className)}>
      {children}
    </div>
  )
}

function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('text-base font-semibold text-gray-900', className)}>{children}</h3>
  )
}

function CardContent({ children, className }: CardProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn('border-t border-gray-100 px-6 py-4', className)}>{children}</div>
  )
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
