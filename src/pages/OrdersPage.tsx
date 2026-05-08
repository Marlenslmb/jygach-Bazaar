import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { SectionHead } from '@/components/shared/SectionHead'
import { formatShortPrice, timeAgo, cn } from '@/lib/utils'

const sidebarSections = [
  {
    title: 'Категории',
    items: [
      { id: 'all', label: 'Все заказы', count: 42 },
      { id: 'kitchen', label: 'Кухни', count: 12 },
      { id: 'wardrobe', label: 'Шкафы', count: 9 },
      { id: 'bedroom', label: 'Спальни', count: 7 },
      { id: 'office', label: 'Офис', count: 5 },
      { id: 'kids', label: 'Детская', count: 4 },
      { id: 'other', label: 'Прочее', count: 5 },
    ],
  },
  {
    title: 'Бюджет (сом)',
    items: [
      { id: 'b1', label: 'До 30 000' },
      { id: 'b2', label: '30 — 80 000' },
      { id: 'b3', label: '80 — 200 000' },
      { id: 'b4', label: 'Свыше 200 000' },
    ],
  },
  {
    title: 'Город',
    items: [
      { id: 'c-all', label: 'Все', count: 42 },
      { id: 'c-bishkek', label: 'Бишкек', count: 28 },
      { id: 'c-osh', label: 'Ош', count: 8 },
      { id: 'c-karakol', label: 'Каракол', count: 3 },
      { id: 'c-ja', label: 'Джалал-Абад', count: 3 },
    ],
  },
]

const statusStyles = {
  open: 'bg-[#e6f0d8] text-[#4a5a2a]',
  in_progress: 'bg-[#fce4cf] text-amber-deep',
  done: 'bg-bg-warm text-ink-muted',
  cancelled: 'bg-bg-warm text-ink-muted',
}

const statusLabels = {
  open: 'Открыт',
  in_progress: 'В работе',
  done: 'Завершён',
  cancelled: 'Отменён',
}

export function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({
    Категории: 'all',
    Город: 'c-all',
  })
  const showToast = useAppStore((s) => s.showToast)

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  })

  return (
    <div className="animate-page-in">
      <SectionHead
        title="Заказы"
        emphasis="на изготовление"
        description="Заказчики публикуют проекты — мастера откликаются с предложениями. Открытые тендеры."
        action={
          <Link to="/orders/new" className="btn-primary">
            + Опубликовать заказ
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          {sidebarSections.map((sec) => (
            <div key={sec.title} className="card p-5">
              <h4 className="font-display text-base font-semibold mb-3.5">{sec.title}</h4>
              <div className="flex flex-col gap-1">
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      setActiveFilter((s) => ({ ...s, [sec.title]: item.id }))
                    }
                    className={cn(
                      'flex justify-between items-center px-3 py-2 rounded-lg text-[13px] font-medium text-ink-soft text-left transition-colors hover:bg-bg-warm',
                      activeFilter[sec.title] === item.id && 'bg-bg-warm text-ink'
                    )}
                  >
                    {item.label}
                    {'count' in item && item.count !== undefined && (
                      <span className="text-[11px] bg-bg px-2 py-0.5 rounded-full text-ink-muted">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* List */}
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card cursor-pointer p-6 hover:border-ink-muted hover:translate-x-1 transition-all block"
            >
              <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
                <div>
                  <h3 className="font-display text-[22px] font-semibold tracking-tight mb-1">
                    {order.title}
                  </h3>
                  <div className="text-[13px] text-ink-muted flex gap-3.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      📍 {order.city}
                      {order.district && `, ${order.district}`}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 Срок: {order.deadlineWeeks} нед
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱ {timeAgo(order.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-ink-muted">Бюджет</div>
                  <div className="font-display text-2xl font-semibold text-amber-deep">
                    {formatShortPrice(order.budget)} сом
                  </div>
                </div>
              </div>
              <p className="text-ink-soft mb-4 leading-relaxed">{order.description}</p>
              <div className="flex justify-between items-center pt-4 border-t border-line-soft flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {order.bidAvatars.map((b, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 border-paper text-amber-soft grid place-items-center text-[11px] font-bold',
                          i > 0 && '-ml-2',
                          b.color === 'b1' && 'bg-wood-mid',
                          b.color === 'b2' && 'bg-moss',
                          b.color === 'b3' && 'bg-amber-deep'
                        )}
                      >
                        {b.initial}
                      </div>
                    ))}
                  </div>
                  <div className="text-[13px] text-ink-muted">
                    <strong className="text-ink">{order.bidsCount} откликов</strong> от мастеров
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                    statusStyles[order.status]
                  )}
                >
                  {statusLabels[order.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
