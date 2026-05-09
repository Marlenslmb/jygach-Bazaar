import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { formatShortPrice, timeAgo, cn } from '@/lib/utils'
import { SlidersHorizontal, X, Plus, MapPin, Clock, Users } from 'lucide-react'

const CATS = [
  { id: 'all', label: 'Все' },
  { id: 'kitchen', label: 'Кухни' },
  { id: 'wardrobe', label: 'Шкафы' },
  { id: 'bedroom', label: 'Спальни' },
  { id: 'office', label: 'Офис' },
  { id: 'kids', label: 'Детская' },
  { id: 'other', label: 'Прочее' },
]

const BUDGETS = [
  { id: 'all', label: 'Любой' },
  { id: 'b1', label: 'до 30к' },
  { id: 'b2', label: '30–80к' },
  { id: 'b3', label: '80–200к' },
  { id: 'b4', label: '200к+' },
]

const CITIES = [
  { id: 'all', label: 'Все города' },
  { id: 'bishkek', label: 'Бишкек' },
  { id: 'osh', label: 'Ош' },
  { id: 'karakol', label: 'Каракол' },
]

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-[#e6f0d8] text-[#4a5a2a]',
  in_progress: 'bg-[#fce4cf] text-amber-deep',
  done: 'bg-bg-warm text-ink-muted',
  cancelled: 'bg-bg-warm text-ink-muted',
}
const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт', in_progress: 'В работе', done: 'Завершён', cancelled: 'Отменён',
}

export function OrdersPage() {
  const [cat, setCat]           = useState('all')
  const [budget, setBudget]     = useState('all')
  const [city, setCity]         = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const showToast = useAppStore((s) => s.showToast)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  })

  const activeFiltersCount = [cat !== 'all', budget !== 'all', city !== 'all'].filter(Boolean).length

  return (
    <div className="animate-page-in">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-none">
            Заказы <em className="italic text-amber-deep font-medium">на изготовление</em>
          </h1>
          <p className="text-ink-muted text-sm mt-1.5 hidden md:block">
            Открытые тендеры — мастера откликаются с предложениями
          </p>
        </div>
        <Link to="/orders/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-deep text-paper text-sm font-bold hover:bg-amber-deep/90 transition-colors shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">Опубликовать</span><span className="sm:hidden">Заказ</span>
        </Link>
      </div>

      {/* Фильтры — мобиле горизонтальный скролл категорий + кнопка фильтров */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 no-scrollbar">
          {CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0',
                cat === c.id ? 'bg-wood-dark text-paper' : 'bg-paper border border-line text-ink-soft hover:border-ink-muted'
              )}>
              {c.label}
            </button>
          ))}
        </div>
        {/* Кнопка доп.фильтров */}
        <button onClick={() => setFilterOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold shrink-0 transition-colors',
            activeFiltersCount > 0
              ? 'bg-amber-deep text-paper border-amber-deep'
              : 'bg-paper border-line text-ink-soft hover:border-ink-muted'
          )}>
          <SlidersHorizontal size={14} />
          {activeFiltersCount > 0 && <span>{activeFiltersCount}</span>}
        </button>
      </div>

      <div className="text-xs text-ink-muted mb-4">{orders.length} заказов</div>

      {/* Список заказов */}
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-bg-warm" />
            ))
          : orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`}
                className="card block hover:border-ink-muted transition-all hover:-translate-y-0.5">
                <div className="p-4">
                  {/* Верх — заголовок + бюджет */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-lg md:text-xl font-semibold tracking-tight leading-tight flex-1">
                      {order.title}
                    </h3>
                    <div className="text-right shrink-0">
                      <div className="font-display text-lg font-bold text-amber-deep leading-none">
                        {formatShortPrice(order.budget)}
                      </div>
                      <div className="text-[10px] text-ink-muted">сом</div>
                    </div>
                  </div>

                  {/* Описание — 2 строки */}
                  <p className="text-sm text-ink-soft line-clamp-2 mb-3">{order.description}</p>

                  {/* Мета + статус */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {order.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {order.deadlineWeeks} нед
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {order.bidsCount} откликов
                      </span>
                      <span className="text-ink-muted/60">{timeAgo(order.createdAt)}</span>
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                      STATUS_STYLES[order.status]
                    )}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {/* Фильтр — мобильный drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-wood-dark/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-bg rounded-t-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Фильтры</h3>
              <button onClick={() => setFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-bg-warm grid place-items-center">
                <X size={16} />
              </button>
            </div>

            {/* Бюджет */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Бюджет</div>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <button key={b.id} onClick={() => setBudget(b.id)}
                    className={cn('px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                      budget === b.id ? 'bg-wood-dark text-paper border-wood-dark' : 'border-line text-ink-soft')}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Город */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Город</div>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button key={c.id} onClick={() => setCity(c.id)}
                    className={cn('px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                      city === c.id ? 'bg-wood-dark text-paper border-wood-dark' : 'border-line text-ink-soft')}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setCat('all'); setBudget('all'); setCity('all') }}
                className="flex-1 py-3 rounded-xl border border-line text-sm font-semibold hover:bg-bg-warm">
                Сбросить
              </button>
              <button onClick={() => setFilterOpen(false)}
                className="flex-1 py-3 rounded-xl bg-wood-dark text-paper text-sm font-bold">
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
