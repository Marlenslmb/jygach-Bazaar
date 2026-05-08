import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-ink-muted mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {item.to ? (
            <Link
              to={item.to}
              className="hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-ink font-medium">{item.label}</span>
          )}
          {i < items.length - 1 && (
            <ChevronRight size={14} className="text-line opacity-60" />
          )}
        </span>
      ))}
    </nav>
  )
}
