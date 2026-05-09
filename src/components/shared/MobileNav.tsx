import { NavLink } from 'react-router-dom'
import { Home, Package, Users, ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/',          label: 'Главная',   icon: Home,          end: true  },
  { to: '/materials', label: 'Материалы', icon: Package,       end: false },
  { to: '/masters',   label: 'Мастера',   icon: Users,         end: false },
  { to: '/orders',    label: 'Заказы',    icon: ClipboardList, end: false },
  { to: '/profile',   label: 'Кабинет',   icon: User,          end: false },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-bg/95 backdrop-blur-xl border-t border-line safe-area-pb">
      <div className="flex">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="flex-1">
            {({ isActive }) => (
              <div className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 transition-colors',
                isActive ? 'text-amber-deep' : 'text-ink-muted'
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={cn(
                  'text-[10px] font-semibold',
                  isActive ? 'text-amber-deep' : 'text-ink-muted'
                )}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-amber-deep rounded-full" />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
