import type { ReactNode } from 'react'

interface SectionHeadProps {
  title: string
  emphasis?: string
  description?: string
  action?: ReactNode
}

export function SectionHead({ title, emphasis, description, action }: SectionHeadProps) {
  return (
    <div className="flex justify-between items-end mb-8 gap-6 flex-wrap">
      <div>
        <h2 className="font-display text-[clamp(32px,4vw,48px)] font-normal tracking-tight leading-none">
          {title}{' '}
          {emphasis && (
            <em className="italic text-amber-deep font-medium">{emphasis}</em>
          )}
        </h2>
        {description && (
          <p className="mt-3 text-ink-muted max-w-md">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
