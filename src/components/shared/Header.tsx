import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageCircle, MapPin, PenSquare,
  LogIn, LogOut, User, Menu, X,
  Home, Package, Users, ClipboardList, Wrench,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { messagesApi } from '@/api/client'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',            label: 'Главная',     end: true,  icon: <Home size={18} /> },
  { to: '/materials',   label: 'Материалы',   end: false, icon: <Package size={18} /> },
  { to: '/masters',     label: 'Мастера',     end: false, icon: <Users size={18} /> },
  { to: '/orders',      label: 'Заказы',      end: false, icon: <ClipboardList size={18} /> },
  { to: '/constructor', label: 'Конструктор', end: false, icon: <Wrench size={18} /> },
]

const roleLabels = {
  customer: 'Заказчик',
  master:   'Мастер',
  supplier: 'Поставщик',
} as const

export function Header() {
  const { role, setRole, city } = useAppStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [user, setUser]         = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Закрываем меню при смене страницы
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Блокируем скролл когда меню открыто
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Загружаем сессию и роль
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (data?.role) setRole(data.role)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          if (data?.role) setRole(data.role)
        } else {
          setRole('customer')
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Выход
  const handleSignOut = async () => {
    setMenuOpen(false)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('signOut error:', e)
    }
    setUser(null)
    setRole('customer')
    navigate('/')
  }

  // Непрочитанные сообщения
  const { data: threads = [] } = useQuery({
    queryKey: ['threads'],
    queryFn: () => messagesApi.getThreads(),
    enabled: !!user,
    refetchInterval: user ? 15000 : false,
  })
  const unreadCount = threads.reduce((s: number, t: any) => s + (t.unread ?? 0), 0)

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-line">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 md:h-16 flex items-center gap-3 md:gap-8">

          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 font-display text-[20px] md:text-[22px] font-semibold tracking-tight shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-wood-dark rounded-full grid place-items-center text-amber-soft font-display italic font-bold text-[16px] md:text-[18px]">J</div>
            <span className="hidden sm:block">Jygach <span className="italic text-amber-deep font-medium">bazaar</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 flex-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => cn(
                  'px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  isActive ? 'bg-wood-dark text-paper' : 'text-ink-soft hover:bg-bg-warm hover:text-ink'
                )}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper border border-line text-[13px] font-medium">
              <MapPin size={14} /> {city}
            </div>
            <Link to="/orders/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-soft text-amber-deep text-[13px] font-semibold border border-amber-soft hover:bg-amber-deep hover:text-paper transition-colors">
              <PenSquare size={14} /> Заказать
            </Link>
            <Link to="/messages"
              className="relative w-[38px] h-[38px] rounded-full bg-paper border border-line grid place-items-center hover:bg-bg-warm transition-all">
              <MessageCircle size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-deep text-paper text-[10px] font-bold grid place-items-center border-2 border-bg">
                  {unreadCount}
                </span>
              )}
            </Link>
            {/* Бейдж роли */}
            {user && (
              <div className={cn(
                'px-3 py-1.5 rounded-full text-[13px] font-semibold',
                role === 'master' ? 'bg-amber-soft text-amber-deep' :
                role === 'supplier' ? 'bg-[#e6f0d8] text-[#4a5a2a]' :
                'bg-bg-warm text-ink-soft border border-line'
              )}>
                {roleLabels[role]}
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile"
                  className="w-[38px] h-[38px] rounded-full bg-amber-soft border border-amber text-amber-deep grid place-items-center hover:bg-amber transition-colors"
                  title={user.email}>
                  <User size={16} />
                </Link>
                <button onClick={handleSignOut}
                  className="w-[38px] h-[38px] rounded-full bg-paper border border-line grid place-items-center hover:bg-bg-warm transition-colors"
                  title="Выйти">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link to="/auth"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-wood-dark text-paper text-[13px] font-semibold hover:bg-amber-deep transition-colors">
                <LogIn size={14} /> Войти
              </Link>
            )}
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <Link to="/messages" className="relative w-9 h-9 rounded-full bg-paper border border-line grid place-items-center">
              <MessageCircle size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-deep text-paper text-[9px] font-bold grid place-items-center border-2 border-bg">
                  {unreadCount}
                </span>
              )}
            </Link>
            {user ? (
              <Link to="/profile" className="w-9 h-9 rounded-full bg-amber-soft border border-amber text-amber-deep grid place-items-center">
                <User size={16} />
              </Link>
            ) : (
              <Link to="/auth" className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-wood-dark text-paper text-xs font-semibold">
                <LogIn size={13} /> Войти
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-paper border border-line grid place-items-center">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-wood-dark/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-14 left-0 right-0 bottom-0 bg-bg flex flex-col overflow-y-auto">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all',
                    isActive ? 'bg-wood-dark text-paper' : 'text-ink hover:bg-bg-warm'
                  )}>
                  <span className="opacity-60">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="h-px bg-line mx-4" />
            <div className="p-4">
              <Link to="/orders/new"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-amber-deep text-paper font-bold text-base">
                <PenSquare size={18} /> Опубликовать заказ
              </Link>
            </div>
            <div className="h-px bg-line mx-4" />
            {user && (
              <div className="px-4 py-3">
                <div className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
                  role === 'master' ? 'bg-amber-soft text-amber-deep' :
                  role === 'supplier' ? 'bg-[#e6f0d8] text-[#4a5a2a]' :
                  'bg-bg-warm text-ink-soft'
                )}>
                  {role === 'master' ? '👨‍🔧' : role === 'supplier' ? '📦' : '🛒'}
                  {roleLabels[role]}
                </div>
              </div>
            )}
            <div className="h-px bg-line mx-4" />
            <div className="flex items-center gap-2 p-4 text-sm text-ink-muted">
              <MapPin size={15} /> {city}
            </div>
            <div className="p-4 mt-auto">
              {user ? (
                <div className="space-y-2">
                  <Link to="/profile"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-amber-soft text-amber-deep font-semibold">
                    <User size={18} /> Личный кабинет
                  </Link>
                  <button onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-bg-warm text-ink-soft font-semibold">
                    <LogOut size={18} /> Выйти
                  </button>
                </div>
              ) : (
                <Link to="/auth"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-wood-dark text-paper font-bold text-base">
                  <LogIn size={18} /> Войти или зарегистрироваться
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
