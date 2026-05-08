import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { mastersApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { SectionHead } from '@/components/shared/SectionHead'
import { cn } from '@/lib/utils'

const filters = [
  { id: 'all', label: 'Все мастера' },
  { id: 'top', label: '★ Топ-рейтинг' },
  { id: 'kitchen', label: 'Кухни' },
  { id: 'wardrobe', label: 'Шкафы-купе' },
  { id: 'bedroom', label: 'Спальни' },
  { id: 'office', label: 'Офисная' },
  { id: 'massive', label: 'Из массива' },
  { id: 'bishkek', label: 'Бишкек' },
  { id: 'osh', label: 'Ош' },
]

export function MastersPage() {
  const [active, setActive] = useState('all')
  const showToast = useAppStore((s) => s.showToast)

  const { data: masters = [], isLoading } = useQuery({
    queryKey: ['masters'],
    queryFn: () => mastersApi.list(),
  })

  // Применяем простой клиентский фильтр
  const filtered = masters.filter((m) => {
    if (active === 'all') return true
    if (active === 'top') return m.rating >= 4.8
    if (active === 'bishkek') return m.city === 'Бишкек'
    if (active === 'osh') return m.city === 'Ош'
    return true
  })

  return (
    <div className="animate-page-in">
      <SectionHead
        title="Мастера"
        emphasis="и студии"
        description="Проверенные мебельщики Кыргызстана с портфолио и отзывами."
      />

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className={cn('filter-chip', active === f.id && 'active')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-[420px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => (
            <article key={m.id} className="card card-hover">
              <Link to={`/masters/${m.id}`} className="block">
                <div className={`master-cover-${m.coverColor} h-[140px] relative`}>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M0 20 L20 0 L40 20 L20 40 Z' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/></svg>\")",
                    }}
                  />
                  {m.verified && (
                    <span className="absolute top-3 right-3 bg-paper px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 text-moss">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="p-5 relative">
                  <div className="absolute -top-8 left-5 w-16 h-16 rounded-full border-4 border-paper bg-wood-dark text-amber-soft grid place-items-center font-display text-[22px] font-bold">
                    {m.initial}
                  </div>
                  <h3 className="font-display text-[22px] font-semibold mt-8 mb-1 tracking-tight">
                    {m.name}
                  </h3>
                  <div className="text-[13px] text-ink-muted mb-4">
                    {m.specialization} • {m.city}
                  </div>
                  <div className="flex gap-4 py-3 border-y border-line-soft mb-4">
                    <Stat num={m.rating.toFixed(1)} label="★ Рейтинг" amber />
                    <Stat num={m.projectsCount.toString()} label="Проектов" />
                    <Stat
                      num={m.yearsExperience.toString()}
                      label={pluralYears(m.yearsExperience)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 bg-bg-warm rounded-full text-[11px] font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    showToast('Открываем чат...')
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-wood-dark text-paper text-[13px] font-semibold transition-colors hover:bg-amber-deep"
                >
                  Написать
                </button>
                <Link
                  to={`/masters/${m.id}`}
                  className="flex-1 py-2.5 rounded-lg bg-transparent border border-ink text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper text-center"
                >
                  Профиль
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ num, label, amber }: { num: string; label: string; amber?: boolean }) {
  return (
    <div className="flex-1">
      <div
        className={cn(
          'font-display text-xl font-semibold leading-none',
          amber && 'text-amber-deep'
        )}
      >
        {num}
      </div>
      <div className="text-[11px] text-ink-muted mt-1">{label}</div>
    </div>
  )
}

function pluralYears(n: number): string {
  if (n === 1) return 'Год'
  if (n >= 2 && n <= 4) return 'Года'
  return 'Лет'
}
