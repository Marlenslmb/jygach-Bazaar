import { useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { materialsApi } from '@/api/client'
import type { MaterialCategory } from '@/api/types'
import { useAppStore } from '@/store/useAppStore'
import { formatPrice, cn } from '@/lib/utils'

const categories: { id: MaterialCategory | 'all'; label: string }[] = [
  { id: 'all',      label: 'Все' },
  { id: 'ldsp',     label: 'ЛДСП' },
  { id: 'mdf',      label: 'МДФ' },
  { id: 'hardware', label: 'Фурнитура' },
  { id: 'edge',     label: 'Кромка' },
  { id: 'glass',    label: 'Стекло' },
  { id: 'fabric',   label: 'Ткани' },
  { id: 'paint',    label: 'Краски' },
  { id: 'handles',  label: 'Ручки' },
  { id: 'hinges',   label: 'Петли' },
]

export function MaterialsPage() {
  const [activeCat, setActiveCat]   = useState<MaterialCategory | 'all'>('all')
  const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid')
  const showToast = useAppStore((s) => s.showToast)

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', activeCat],
    queryFn: () => materialsApi.list(activeCat === 'all' ? undefined : { category: activeCat }),
  })

  return (
    <div className="animate-page-in">
      <div className="mb-5">
        <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-none">
          Каталог <em className="italic text-amber-deep font-medium">материалов</em>
        </h1>
        <p className="text-ink-muted text-sm md:text-base mt-2">
          ЛДСП, МДФ, фурнитура, кромка — от поставщиков КР
        </p>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 no-scrollbar">
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0',
                activeCat === c.id
                  ? 'bg-wood-dark text-paper'
                  : 'bg-paper border border-line text-ink-soft hover:border-ink-muted'
              )}>
              {c.label}
            </button>
          ))}
        </div>
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

      <div className="text-xs text-ink-muted mb-4">{materials.length} позиций</div>

      {/* Скелетон */}
      {isLoading && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
          : 'flex flex-col gap-2'}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn('card animate-pulse bg-bg-warm',
              viewMode === 'grid' ? 'h-44' : 'h-16')} />
          ))}
        </div>
      )}

      {/* GRID */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {materials.map((m) => (
            <Link key={m.id} to={`/materials/${m.id}`}
              className="card card-hover group overflow-hidden">
              <div className={cn(m.imageStyle, 'h-32 relative')}>
                {m.discount && (
                  <span className="absolute top-2 right-2 bg-amber-deep text-paper text-[10px] font-bold px-2 py-0.5 rounded-full">
                    −{m.discount}%
                  </span>
                )}
                {m.isNew && (
                  <span className="absolute top-2 right-2 bg-paper text-amber-deep text-[10px] font-bold px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{m.title}</div>
                <div className="text-[11px] text-ink-muted mb-2">{m.vendorName}</div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-display text-base font-bold">{formatPrice(m.price)}</div>
                    <div className="text-[10px] text-ink-muted">сом/{m.unit}</div>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); showToast('Добавлено') }}
                    className="w-7 h-7 rounded-full bg-bg-warm grid place-items-center hover:bg-wood-dark hover:text-paper transition-all">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LIST */}
      {!isLoading && viewMode === 'list' && (
        <div className="flex flex-col gap-2">
          {materials.map((m) => (
            <Link key={m.id} to={`/materials/${m.id}`}
              className="card card-hover flex items-center gap-3 p-3">
              <div className={cn(m.imageStyle, 'w-14 h-14 rounded-xl shrink-0')} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{m.title}</div>
                <div className="text-xs text-ink-muted">{m.vendorName}</div>
                <div className="flex items-center gap-2 mt-1">
                  {m.inStock
                    ? <span className="text-[10px] text-moss font-semibold">● В наличии</span>
                    : <span className="text-[10px] text-ink-muted">Под заказ</span>}
                  {m.discount && <span className="text-[10px] text-amber-deep font-bold">−{m.discount}%</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-bold text-sm">{formatPrice(m.price)}</div>
                <div className="text-[10px] text-ink-muted">сом/{m.unit}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
