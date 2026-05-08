import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ChefHat, Briefcase, User } from 'lucide-react'
import { signIn, signUp } from '@/api/auth'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/supabase'

type Mode = 'login' | 'register'

const ROLES: { id: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'customer',
    label: 'Заказчик',
    desc: 'Ищу мастера для изготовления мебели',
    icon: <User size={20} />,
  },
  {
    id: 'master',
    label: 'Мастер',
    desc: 'Изготавливаю мебель на заказ',
    icon: <ChefHat size={20} />,
  },
  {
    id: 'supplier',
    label: 'Поставщик',
    desc: 'Продаю материалы и фурнитуру',
    icon: <Briefcase size={20} />,
  },
]

export function AuthPage() {
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const setRole = useAppStore((s) => s.setRole)

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setLocalRole] = useState<UserRole>('customer')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signIn(email, password)
        showToast('Добро пожаловать!')
        navigate('/')
      } else {
        if (!name.trim()) { setError('Введите имя'); setLoading(false); return }
        if (password.length < 6) { setError('Пароль минимум 6 символов'); setLoading(false); return }
        await signUp(email, password, name, role)
        setRole(role)
        showToast('Аккаунт создан! Проверьте email для подтверждения.')
        navigate('/')
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Ошибка'
      if (msg.includes('Invalid login')) setError('Неверный email или пароль')
      else if (msg.includes('already registered')) setError('Этот email уже зарегистрирован')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      {/* Фоновый паттерн */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M0 30 L30 0 L60 30 L30 60 Z' fill='none' stroke='%23c8651b' stroke-width='0.5' opacity='0.3'/></svg>\")",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 font-display text-3xl font-semibold tracking-tight">
            <div className="w-12 h-12 bg-wood-dark rounded-full grid place-items-center text-amber-soft font-display italic font-bold text-xl">
              J
            </div>
            <span>Jygach <em className="italic text-amber-deep font-medium">bazaar</em></span>
          </Link>
          <p className="text-ink-muted mt-2 text-sm">Мебельная мастерская Кыргызстана</p>
        </div>

        {/* Карточка */}
        <div className="bg-paper border border-line-soft rounded-2xl p-8 shadow-soft">
          {/* Переключатель */}
          <div className="flex bg-bg-warm rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === m ? 'bg-paper shadow-sm text-ink' : 'text-ink-muted hover:text-ink'
                )}
              >
                {m === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Имя (только регистрация) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Айбек Токтосунов"
                  className="form-input"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="form-input"
                required
              />
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Пароль *
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
                  className="form-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Роль (только регистрация) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Кто вы? *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setLocalRole(r.id)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                        role === r.id
                          ? 'border-amber-deep bg-amber-soft text-amber-deep'
                          : 'border-line bg-bg-warm text-ink-soft hover:border-ink-muted'
                      )}
                    >
                      <span className={cn('shrink-0', role === r.id && 'text-amber-deep')}>
                        {r.icon}
                      </span>
                      <div>
                        <div className="font-semibold text-sm">{r.label}</div>
                        <div className="text-xs opacity-70">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? 'Подождите...'
                : mode === 'login' ? 'Войти' : 'Создать аккаунт'
              }
            </button>
          </form>

          {/* Ссылка на главную */}
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-ink-muted hover:text-ink transition-colors">
              ← Вернуться на главную
            </Link>
          </div>
        </div>

        {/* Для тестировщиков */}
        <div className="mt-4 bg-amber-soft/50 border border-amber-soft rounded-xl p-4 text-xs text-amber-deep">
          <strong>Для тестирования:</strong> создай аккаунт через регистрацию. Можно использовать любой email.
        </div>
      </div>
    </div>
  )
}
