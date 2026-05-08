import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, Share2, Plus, Minus, ShieldCheck, Truck, Package } from 'lucide-react'
import { useState } from 'react'
import { materialsApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { PageSkeleton, NotFoundState } from '@/components/ui/Skeleton'
import { cn, formatPrice } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
  ldsp: 'ЛДСП',
  mdf: 'МДФ',
  hardware: 'Фурнитура',
  edge: 'Кромка ПВХ',
  glass: 'Стекло',
  fabric: 'Ткани',
  paint: 'Краски и лаки',
  handles: 'Ручки',
  hinges: 'Петли',
}

export function MaterialDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const showToast = useAppStore((s) => s.showToast)
  const { favorites, toggleFavorite } = useAppStore()
  const isFav = favorites.materials.includes(id)

  const [qty, setQty] = useState(1)

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', id],
    queryFn: () => materialsApi.getById(id),
    enabled: !!id,
  })

  const { data: similar = [] } = useQuery({
    queryKey: ['material-similar', id],
    queryFn: () => materialsApi.getSimilar(id),
    enabled: !!id,
  })

  if (isLoading) return <PageSkeleton />
  if (!material)
    return (
      <NotFoundState
        title="Материал не найден"
        backTo="/materials"
        backLabel="Все материалы"
      />
    )

  const finalPrice = material.discount
    ? Math.round(material.price * (1 - material.discount / 100))
    : material.price

  return (
    <div className="animate-page-in">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Материалы', to: '/materials' },
          { label: categoryLabels[material.category] ?? 'Категория' },
          { label: material.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 mb-16">
        {/* Left: image gallery */}
        <div>
          <div
            className={cn(
              material.imageStyle,
              'h-[420px] md:h-[520px] rounded-2xl relative overflow-hidden'
            )}
          >
            {material.discount && (
              <div className="absolute top-4 left-4 bg-amber-deep text-paper px-3 py-1.5 rounded-full text-sm font-bold">
                −{material.discount}%
              </div>
            )}
            {material.isNew && (
              <div className="absolute top-4 left-4 bg-paper px-3 py-1.5 rounded-full text-sm font-bold text-amber-deep">
                NEW
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  toggleFavorite('materials', material.id)
                  showToast(isFav ? 'Удалено из избранного' : 'Добавлено в избранное')
                }}
                className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center hover:bg-paper transition-colors"
              >
                <Heart
                  size={16}
                  className={cn(
                    isFav && 'fill-amber-deep text-amber-deep'
                  )}
                />
              </button>
              <button
                onClick={() => showToast('Ссылка скопирована')}
                className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center hover:bg-paper transition-colors"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
          {/* Thumbs row (placeholder) */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  material.imageStyle,
                  'aspect-square rounded-lg cursor-pointer transition-all',
                  i === 1
                    ? 'ring-2 ring-amber-deep ring-offset-2 ring-offset-bg'
                    : 'opacity-60 hover:opacity-100'
                )}
              />
            ))}
          </div>
        </div>

        {/* Right: info & purchase */}
        <div className="space-y-5">
          <div>
            <div className="text-xs text-ink-muted uppercase tracking-wider mb-1.5">
              {categoryLabels[material.category]}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-3">
              {material.title}
            </h1>
            <Link
              to="#"
              onClick={() => showToast(`Профиль ${material.vendorName}`)}
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-moss" />
              Поставщик: <strong className="text-ink">{material.vendorName}</strong>
            </Link>
          </div>

          {/* Price block */}
          <div className="card p-5">
            <div className="flex items-end gap-3 mb-1">
              <div className="font-display text-4xl font-semibold leading-none">
                {formatPrice(finalPrice)}
                <span className="font-sans text-base text-ink-muted font-medium ml-1">
                  сом / {material.unit}
                </span>
              </div>
            </div>
            {material.discount && (
              <div className="text-sm text-ink-muted line-through">
                {formatPrice(material.price)} сом
              </div>
            )}

            {/* Stock indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-[13px]">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  material.inStock ? 'bg-moss' : 'bg-amber-deep'
                )}
              />
              {material.inStock ? (
                <span className="text-moss font-medium">В наличии</span>
              ) : (
                <span className="text-amber-deep font-medium">Под заказ</span>
              )}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center bg-bg-warm rounded-full">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 grid place-items-center hover:text-amber-deep transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 grid place-items-center hover:text-amber-deep transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-sm text-ink-muted">{material.unit}</span>
            </div>

            {/* CTA buttons */}
            <div className="mt-5 space-y-2">
              <button
                onClick={() =>
                  showToast(`${qty} ${material.unit} добавлено в проект`)
                }
                className="w-full btn-primary justify-center"
              >
                Добавить в проект
              </button>
              <button
                onClick={() => showToast('Запрос отправлен поставщику')}
                className="w-full btn-secondary justify-center"
              >
                Запросить у поставщика
              </button>
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-line-soft flex justify-between items-center">
              <span className="text-sm text-ink-muted">Итого:</span>
              <strong className="font-display text-2xl text-amber-deep">
                {formatPrice(finalPrice * qty)} сом
              </strong>
            </div>
          </div>

          {/* Trust signals */}
          <div className="card p-5 space-y-3">
            {material.warranty && (
              <TrustRow
                icon={<ShieldCheck size={16} className="text-moss" />}
                title="Гарантия"
                value={material.warranty}
              />
            )}
            {material.minOrder && (
              <TrustRow
                icon={<Package size={16} className="text-moss" />}
                title="Минимальный заказ"
                value={material.minOrder}
              />
            )}
            <TrustRow
              icon={<Truck size={16} className="text-moss" />}
              title="Доставка"
              value="по Бишкеку — на следующий день"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {material.description && (
        <section className="mb-12 max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4 tracking-tight">
            Описание
          </h2>
          <p className="text-ink-soft leading-relaxed text-[15px]">
            {material.description}
          </p>
        </section>
      )}

      {/* Specs */}
      {material.specs && material.specs.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5 tracking-tight">
            Характеристики
          </h2>
          <div className="card overflow-hidden max-w-3xl">
            {material.specs.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  'flex justify-between items-center px-5 py-3.5',
                  i !== material.specs!.length - 1 &&
                    'border-b border-line-soft',
                  i % 2 === 0 ? 'bg-paper' : 'bg-bg-warm/40'
                )}
              >
                <span className="text-ink-muted text-sm">{s.label}</span>
                <strong className="font-medium text-right">{s.value}</strong>
              </div>
            ))}
            {material.origin && (
              <div className="flex justify-between items-center px-5 py-3.5 border-t border-line-soft">
                <span className="text-ink-muted text-sm">Производство</span>
                <strong className="font-medium">{material.origin}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Similar materials */}
      {similar.length > 0 && (
        <section>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5 tracking-tight">
            Похожие <em className="italic text-amber-deep font-medium">материалы</em>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {similar.map((m) => (
              <Link
                key={m.id}
                to={`/materials/${m.id}`}
                className="card card-hover"
              >
                <div className={cn(m.imageStyle, 'h-40 relative')} />
                <div className="p-4">
                  <h4 className="font-display text-base font-semibold mb-1">
                    {m.title}
                  </h4>
                  <div className="text-xs text-ink-muted mb-2">{m.vendorName}</div>
                  <div className="font-display text-lg font-semibold">
                    {formatPrice(m.price)}{' '}
                    <span className="text-xs text-ink-muted font-sans font-medium">
                      сом/{m.unit}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TrustRow({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-bg-warm grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider">
          {title}
        </div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
