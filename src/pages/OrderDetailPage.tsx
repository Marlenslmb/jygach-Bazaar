import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { ordersApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { PageSkeleton, NotFoundState } from '@/components/ui/Skeleton'
import { cn, formatPrice, formatShortPrice, timeAgo } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
  kitchen: 'Кухня',
  wardrobe: 'Шкаф-купе',
  bedroom: 'Спальня',
  living: 'Гостиная',
  office: 'Офис',
  kids: 'Детская',
  hallway: 'Прихожая',
  other: 'Прочее',
}

const statusLabels = {
  open: 'Открыт для предложений',
  in_progress: 'Выбран мастер',
  done: 'Завершён',
  cancelled: 'Отменён',
}

const statusStyles = {
  open: 'bg-[#e6f0d8] text-[#4a5a2a]',
  in_progress: 'bg-[#fce4cf] text-amber-deep',
  done: 'bg-bg-warm text-ink-muted',
  cancelled: 'bg-bg-warm text-ink-muted',
}

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const showToast = useAppStore((s) => s.showToast)
  const role = useAppStore((s) => s.role)
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })

  const { data: bids = [] } = useQuery({
    queryKey: ['order-bids', id],
    queryFn: () => ordersApi.getBids(id),
    enabled: !!id,
  })

  // Форма отклика мастера
  const [bidPrice, setBidPrice] = useState('')
  const [bidDays, setBidDays] = useState('')
  const [bidMessage, setBidMessage] = useState('')

  const createBidMutation = useMutation({
    mutationFn: (payload: {
      orderId: string
      proposedPrice: number
      proposedDays: number
      message: string
    }) =>
      ordersApi.createBid({
        ...payload,
        masterId: 'mst-current',
        masterName: 'Ваша студия',
        masterInitial: 'Я',
        masterRating: 4.8,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-bids', id] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setBidPrice('')
      setBidDays('')
      setBidMessage('')
      showToast('Отклик отправлен заказчику!')
    },
  })

  const submitBid = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseInt(bidPrice)
    const days = parseInt(bidDays)
    if (!price || !days || !bidMessage.trim()) {
      showToast('Заполните все поля')
      return
    }
    createBidMutation.mutate({
      orderId: id,
      proposedPrice: price,
      proposedDays: days,
      message: bidMessage,
    })
  }

  if (isLoading) return <PageSkeleton />
  if (!order)
    return (
      <NotFoundState
        title="Заявка не найдена"
        backTo="/orders"
        backLabel="Все заявки"
      />
    )

  return (
    <div className="animate-page-in">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Заказы', to: '/orders' },
          { label: order.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Main column */}
        <div className="space-y-6">
          {/* Header card */}
          <div className="card p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
                {categoryLabels[order.category]}
              </span>
              <span
                className={cn(
                  'text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                  statusStyles[order.status]
                )}
              >
                {statusLabels[order.status]}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-4">
              {order.title}
            </h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {order.city}
                {order.district && `, ${order.district}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Срок: {order.deadlineWeeks} нед
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                Опубликовано {timeAgo(order.createdAt)}
              </span>
            </div>
            <p className="text-ink-soft leading-relaxed text-[15px]">
              {order.description}
            </p>
          </div>

          {/* Requirements */}
          {order.requirements && order.requirements.length > 0 && (
            <div className="card p-6 md:p-8">
              <h2 className="font-display text-xl md:text-2xl font-semibold mb-4 tracking-tight">
                Требования
              </h2>
              <ul className="space-y-2.5">
                {order.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px]">
                    <CheckCircle2
                      size={16}
                      className="text-moss mt-0.5 shrink-0"
                    />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments */}
          {order.attachments && order.attachments.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold mb-3">
                Прикреплённые проекты
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.attachments.map((a) => (
                  <div
                    key={a}
                    onClick={() => showToast('Открываем эскиз...')}
                    className="flex items-center gap-3 p-3 bg-bg-warm rounded-lg cursor-pointer hover:bg-line-soft transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-paper grid place-items-center text-amber-deep">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        Эскиз {a}.pdf
                      </div>
                      <div className="text-xs text-ink-muted">
                        Из конструктора · открыть
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bids */}
          <section>
            <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
                Отклики{' '}
                <em className="italic text-amber-deep font-medium">
                  ({bids.length})
                </em>
              </h2>
              {role === 'master' && (
                <a
                  href="#leave-bid"
                  className="text-sm font-semibold border-b border-current pb-0.5"
                >
                  Откликнуться →
                </a>
              )}
            </div>

            {bids.length === 0 ? (
              <div className="card p-8 text-center text-ink-muted">
                Пока нет откликов. Будьте первым!
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((b) => (
                  <article key={b.id} className="card p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-wood-dark text-amber-soft grid place-items-center font-display font-bold shrink-0">
                        {b.masterInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                          <Link
                            to={`/masters/${b.masterId}`}
                            className="font-display text-lg font-semibold hover:text-amber-deep transition-colors"
                          >
                            {b.masterName}
                          </Link>
                          <div className="text-right">
                            <div className="font-display text-xl font-semibold text-amber-deep">
                              {formatShortPrice(b.proposedPrice)} сом
                            </div>
                            <div className="text-xs text-ink-muted">
                              {b.proposedDays} дней
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-ink-muted mb-3">
                          <span className="flex items-center gap-1">
                            <Star
                              size={12}
                              className="fill-amber text-amber"
                            />
                            {b.masterRating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(b.createdAt)}</span>
                        </div>
                        <p className="text-ink-soft text-[14px] leading-relaxed mb-3">
                          {b.message}
                        </p>
                        {role === 'customer' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                showToast(`Принимаем ${b.masterName}`)
                              }
                              className="px-4 py-2 rounded-lg bg-wood-dark text-paper text-[13px] font-semibold hover:bg-amber-deep transition-colors"
                            >
                              Принять предложение
                            </button>
                            <button
                              onClick={() => showToast('Открываем чат...')}
                              className="px-4 py-2 rounded-lg border border-ink text-[13px] font-semibold hover:bg-ink hover:text-paper transition-colors"
                            >
                              Обсудить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Form для роли мастер */}
          {role === 'master' && order.status === 'open' && (
            <section id="leave-bid" className="card p-6 md:p-8 scroll-mt-24">
              <h3 className="font-display text-xl font-semibold mb-1">
                Оставить отклик
              </h3>
              <p className="text-sm text-ink-muted mb-5">
                Предложите свою цену и срок. Заказчик увидит ваш профиль и портфолио.
              </p>
              <form onSubmit={submitBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Цена (сом)">
                    <input
                      type="number"
                      placeholder="170000"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      className="form-input"
                    />
                  </FormField>
                  <FormField label="Срок (дней)">
                    <input
                      type="number"
                      placeholder="14"
                      value={bidDays}
                      onChange={(e) => setBidDays(e.target.value)}
                      className="form-input"
                    />
                  </FormField>
                </div>
                <FormField label="Сообщение заказчику">
                  <textarea
                    rows={4}
                    placeholder="Расскажите, почему вы подходите для этого проекта..."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    className="form-input resize-none"
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={createBidMutation.isPending}
                  className="btn-primary disabled:opacity-50"
                >
                  {createBidMutation.isPending ? 'Отправка...' : 'Отправить отклик'}
                </button>
              </form>
            </section>
          )}

          {/* Info hint для не-мастеров */}
          {role !== 'master' && order.status === 'open' && (
            <div className="card p-5 bg-bg-warm/50 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-deep shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Вы заходите как «{roleLabel(role)}»</strong>. Чтобы откликнуться
                на заявку, переключите роль на «Мастер» в шапке сайта (это для прототипа,
                в боевой версии будет авторизация).
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          {/* Budget */}
          <div className="card p-5">
            <div className="text-xs text-ink-muted uppercase tracking-wider mb-1">
              Бюджет заказчика
            </div>
            <div className="font-display text-3xl font-semibold text-amber-deep mb-1">
              {formatPrice(order.budget)} сом
            </div>
            <div className="text-sm text-ink-muted">
              Срок: до {order.deadlineWeeks} недель
            </div>
          </div>

          {/* Customer */}
          {order.customerName && (
            <div className="card p-5">
              <h4 className="font-display text-base font-semibold mb-3">Заказчик</h4>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-bg-warm grid place-items-center font-display font-bold">
                  {order.customerInitial}
                </div>
                <div>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-xs text-ink-muted">
                    {order.city}
                    {order.district && `, ${order.district}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-wood-dark text-paper p-5 rounded-2xl">
            <h4 className="font-display text-lg italic font-medium text-amber-soft mb-2">
              Похожий заказ?
            </h4>
            <p className="text-xs text-paper/70 mb-4 leading-relaxed">
              Опубликуйте свою заявку и получайте предложения от мастеров.
            </p>
            <button
              onClick={() => showToast('Создание заявки')}
              className="w-full bg-amber text-paper py-2.5 rounded-lg text-[13px] font-bold hover:bg-amber-deep transition-colors"
            >
              + Опубликовать заказ
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
        {label}
      </div>
      {children}
    </label>
  )
}

function roleLabel(r: string): string {
  return r === 'customer' ? 'Заказчик' : r === 'supplier' ? 'Поставщик' : 'Мастер'
}
