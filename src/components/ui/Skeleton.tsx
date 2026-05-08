import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-warm rounded-lg',
        className
      )}
    />
  )
}

// Готовый skeleton для всей страницы
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-page-in">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-[300px] w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

// Состояние «не найдено»
export function NotFoundState({
  title = 'Не найдено',
  message,
  backTo,
  backLabel = 'Вернуться назад',
}: {
  title?: string
  message?: string
  backTo?: string
  backLabel?: string
}) {
  return (
    <div className="card p-12 text-center max-w-lg mx-auto my-12">
      <div className="text-6xl mb-4 opacity-40">🪑</div>
      <h2 className="font-display text-2xl font-semibold mb-2">{title}</h2>
      {message && <p className="text-ink-muted mb-6">{message}</p>}
      {backTo && (
        <a href={backTo} className="btn-secondary">
          {backLabel}
        </a>
      )}
    </div>
  )
}
