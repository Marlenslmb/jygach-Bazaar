import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { materialsApi } from '@/api/client'
import type { MaterialCategory } from '@/api/types'
import { useAppStore } from '@/store/useAppStore'
import { SectionHead } from '@/components/shared/SectionHead'
import { formatPrice, cn } from '@/lib/utils'

const categories: { id: MaterialCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Все категории' },
  { id: 'ldsp', label: 'ЛДСП' },
  { id: 'mdf', label: 'МДФ' },
  { id: 'hardware', label: 'Фурнитура' },
  { id: 'edge', label: 'Кромка ПВХ' },
  { id: 'glass', label: 'Стекло' },
  { id: 'fabric', label: 'Ткани' },
  { id: 'paint', label: 'Краски и лаки' },
  { id: 'handles', label: 'Ручки' },
  { id: 'hinges', label: 'Петли' },
]

export function MaterialsPage() {
  const [activeCat, setActiveCat] = useState<MaterialCategory | 'all'>('all')
  const showToast = useAppStore((s) => s.showToast)

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', activeCat],
    queryFn: () =>
      materialsApi.list(
        activeCat === 'all' ? undefined : { category: activeCat as MaterialCategory }
      ),
  })

  return (
    <div className="animate-page-in">
      <SectionHead
        title="Каталог"
        emphasis="материалов"
        description="ЛДСП, МДФ, фурнитура, кромка, фасады — от поставщиков по всему Кыргызстану."
      />

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={cn('filter-chip', activeCat === c.id && 'active')}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-[180px] bg-bg-warm" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-bg-warm rounded w-3/4" />
                <div className="h-3 bg-bg-warm rounded w-1/2" />
                <div className="h-7 bg-bg-warm rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {materials.map((m) => (
            <Link
              key={m.id}
              to={`/materials/${m.id}`}
              className="card card-hover cursor-pointer block"
            >
              <div className={cn(m.imageStyle, 'h-[180px] relative overflow-hidden')}>
                {m.discount && (
                  <div className="absolute top-3 right-3 bg-paper px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-deep">
                    −{m.discount}%
                  </div>
                )}
                {m.isNew && (
                  <div className="absolute top-3 right-3 bg-paper px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-deep">
                    NEW
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-[17px] font-semibold mb-1">{m.title}</h3>
                <div className="text-xs text-ink-muted mb-3 flex items-center gap-1.5 before:content-['•'] before:text-moss">
                  {m.vendorName}
                </div>
                <div className="flex justify-between items-end">
                  <div className="font-display text-[22px] font-semibold leading-none">
                    {formatPrice(m.price)}
                    <small className="font-sans text-xs text-ink-muted font-medium ml-0.5">
                      {' '}
                      сом{m.unit !== 'шт' && `/${m.unit}`}
                    </small>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      showToast('Добавлено в проект')
                    }}
                    className="w-9 h-9 rounded-full bg-bg-warm grid place-items-center transition-all hover:bg-wood-dark hover:text-paper hover:rotate-90"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
