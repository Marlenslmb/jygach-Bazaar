import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, CheckCircle2, MessageCircle, LayoutGrid, List } from 'lucide-react'
import { mastersApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const filters = [
  { id: 'all',      label: 'Все' },
  { id: 'top',      label: '★ Топ' },
  { id: 'bishkek',  label: 'Бишкек' },
  { id: 'osh',      label: 'Ош' },
  { id: 'kitchen',  label: 'Кухни' },
  { id: 'wardrobe', label: 'Шкафы' },
  { id: 'massive',  label: 'Массив' },
]

export function MastersPage() {
  const [active, setActive]   = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const showToast = useAppStore((s) => s.showToast)

  const { data: masters = [], isLoading } = useQuery({
    queryKey: ['masters'],
    queryFn: () => mastersApi.list(),
  })

  const filtered = masters.filter((m) => {
    if (active === 'top')     return m.rating >= 4.8
    if (active === 'bishkek') return m.city === 'Бишкек'
    if (active === 'osh')     return m.city === 'Ош'
    return true
  })

  return (
    <div className="animate-page-in">
      {/* Заголовок */}
      <div className="mb-5">
        <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-none">
          Мастера <em className="italic text-amber-deep font-medium">и студии</em>
        </h1>
        <p className="text-ink-muted text-sm md:text-base mt-2">
          Проверенные мебельщики Кыргызстана
        </p>
      </div>

      {/* Фильтры + переключатель вида */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 no-scrollbar">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setActive(f.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0',
                active === f.id
                  ? 'bg-wood-dark text-paper'
                  : 'bg-paper border border-line text-ink-soft hover:border-ink-muted'
              )}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Переключатель вида */}
        <div className="flex bg-bg-warm border border-line rounded-lg p-0.5 shrink-0">
          <button onClick={() => setViewMode('grid')}
            className={cn('w-8 h-8 rounded-md grid place-items-center transition-colors',
              viewMode === 'grid' ? 'bg-paper shadow-sm text-ink' : 'text-ink-muted')}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={cn('w-8 h-8 rounded-md grid place-items-center transition-colors',
              viewMode === 'list' ? 'bg-paper shadow-sm text-ink' : 'text-ink-muted')}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Счётчик */}
      <div className="text-xs text-ink-muted mb-4">{filtered.length} мастеров</div>

      {/* Скелетон */}
      {isLoading && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
          : 'flex flex-col gap-2'}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn('card animate-pulse bg-bg-warm',
              viewMode === 'grid' ? 'h-48' : 'h-20')} />
          ))}
        </div>
      )}

      {/* GRID вид */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((m) => (
            <Link key={m.id} to={`/masters/${m.id}`}
              className="card card-hover group overflow-hidden">
              {/* Цветная полоска сверху */}
              <div className={`master-cover-${m.coverColor} h-2`} />
              <div className="p-3.5">
                {/* Аватар + имя */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-10 h-10 rounded-full bg-wood-dark text-amber-soft grid place-items-center font-display font-bold text-base shrink-0">
                    {m.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight truncate">{m.name}</div>
                    <div className="text-[11px] text-ink-muted truncate">{m.city}</div>
                  </div>
                </div>
                {/* Специализация */}
                <div className="text-[11px] text-ink-muted mb-2.5 line-clamp-1">
                  {m.specialization}
                </div>
                {/* Рейтинг + проекты */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="fill-amber text-amber" />
                    <span className="text-xs font-bold">{m.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted">{m.projectsCount} проектов</div>
                </div>
                {/* Verified */}
                {m.verified && (
                  <div className="flex items-center gap-1 mt-1.5 text-moss text-[10px] font-semibold">
                    <CheckCircle2 size={10} /> Проверен
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LIST вид */}
      {!isLoading && viewMode === 'list' && (
        <div className="flex flex-col gap-2">
          {filtered.map((m) => (
            <Link key={m.id} to={`/masters/${m.id}`}
              className="card card-hover flex items-center gap-3 p-3.5">
              {/* Аватар */}
              <div className={`w-12 h-12 rounded-xl bg-wood-dark text-amber-soft grid place-items-center font-display font-bold text-lg shrink-0 master-cover-${m.coverColor}`}>
                <span className="text-paper">{m.initial}</span>
              </div>
              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{m.name}</span>
                  {m.verified && <CheckCircle2 size={13} className="text-moss shrink-0" />}
                </div>
                <div className="text-xs text-ink-muted truncate">{m.specialization} · {m.city}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {m.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] bg-bg-warm px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              {/* Рейтинг */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  <Star size={12} className="fill-amber text-amber" />
                  <span className="font-bold text-sm">{m.rating.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-ink-muted">{m.projectsCount} пр.</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
