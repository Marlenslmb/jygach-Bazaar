import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Heart,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { mastersApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { PageSkeleton, NotFoundState, Skeleton } from '@/components/ui/Skeleton'
import { cn, formatPrice, timeAgo } from '@/lib/utils'

export function MasterDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const { favorites, toggleFavorite } = useAppStore()
  const isFav = favorites.masters.includes(id)

  const { data: master, isLoading } = useQuery({
    queryKey: ['master', id],
    queryFn: () => mastersApi.getById(id),
    enabled: !!id,
  })

  const { data: portfolio = [] } = useQuery({
    queryKey: ['master-portfolio', id],
    queryFn: () => mastersApi.getPortfolio(id),
    enabled: !!id,
  })

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['master-reviews', id],
    queryFn: () => mastersApi.getReviews(id),
    enabled: !!id,
  })

  if (isLoading) return <PageSkeleton />
  if (!master)
    return (
      <NotFoundState
        title="Мастер не найден"
        message="Возможно, профиль был удалён или ссылка устарела."
        backTo="/masters"
        backLabel="Все мастера"
      />
    )

  return (
    <div className="animate-page-in">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Мастера', to: '/masters' },
          { label: master.name },
        ]}
      />

      {/* Hero / Cover */}
      <section className="relative mb-20">
        <div
          className={`master-cover-${master.coverColor} h-56 md:h-64 rounded-2xl relative z-0 overflow-hidden`}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M0 20 L20 0 L40 20 L20 40 Z' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/></svg>\")",
            }}
          />
          {/* Top right actions */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => {
                toggleFavorite('masters', master.id)
                showToast(isFav ? 'Удалено из избранного' : 'Добавлено в избранное')
              }}
              className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center hover:bg-paper transition-colors"
              title={isFav ? 'Убрать из избранного' : 'В избранное'}
            >
              <Heart
                size={16}
                className={cn(
                  'transition-colors',
                  isFav && 'fill-amber-deep text-amber-deep'
                )}
              />
            </button>
            <button
              onClick={() => showToast('Ссылка скопирована')}
              className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center hover:bg-paper transition-colors"
              title="Поделиться"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Avatar + main info card */}
        <div className="relative z-10 -mt-16 mx-4 md:mx-8 bg-paper border border-line-soft rounded-2xl p-6 md:p-8 shadow-soft">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-paper bg-wood-dark text-amber-soft grid place-items-center font-display text-4xl font-bold shrink-0 -mt-16 shadow-soft">
              {master.initial}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                  {master.name}
                </h1>
                {master.verified && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-moss/10 text-moss text-xs font-bold">
                    <CheckCircle2 size={14} /> Verified
                  </span>
                )}
              </div>
              <div className="text-ink-muted">
                {master.specialization} • {master.city}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {master.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 bg-bg-warm rounded-full text-[11px] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 md:flex-col">
              <button
                onClick={() => navigate('/messages/thread-1')}
                className="btn-primary flex-1 md:flex-none justify-center"
              >
                <MessageCircle size={14} />
                Написать
              </button>
              <a
                href={`tel:${master.phone}`}
                className="btn-secondary flex-1 md:flex-none justify-center"
              >
                <Phone size={14} />
                Позвонить
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Content grid: main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main column */}
        <div className="space-y-12">
          {/* Stats row */}
          <section className="grid grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden">
            <StatCard
              num={master.rating.toFixed(1)}
              label="Рейтинг"
              icon={<Star size={14} className="fill-amber text-amber" />}
              amber
            />
            <StatCard num={master.projectsCount.toString()} label="Проектов выполнено" />
            <StatCard
              num={master.yearsExperience.toString()}
              label={`${pluralYears(master.yearsExperience)} на рынке`}
            />
          </section>

          {/* About */}
          {master.bio && (
            <section>
              <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4 tracking-tight">
                О мастере
              </h2>
              <p className="text-ink-soft leading-relaxed text-[15px] max-w-2xl">
                {master.bio}
              </p>
            </section>
          )}

          {/* Services */}
          {master.services && master.services.length > 0 && (
            <section>
              <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5 tracking-tight">
                Услуги <em className="italic text-amber-deep font-medium">и цены</em>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {master.services.map((s) => (
                  <div
                    key={s.title}
                    className="card p-4 hover:border-line transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <h4 className="font-display text-lg font-semibold">{s.title}</h4>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider">
                          От
                        </div>
                        <div className="font-display text-lg font-semibold text-amber-deep">
                          {formatPrice(s.priceFrom)} с
                        </div>
                      </div>
                    </div>
                    {s.description && (
                      <p className="text-[13px] text-ink-muted leading-relaxed">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Portfolio */}
          {portfolio.length > 0 && (
            <section>
              <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5 tracking-tight">
                Портфолио <em className="italic text-amber-deep font-medium">работ</em>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolio.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => showToast(`Открываем «${p.title}»`)}
                    className="rounded-xl overflow-hidden cursor-pointer group relative shadow-soft hover:shadow-lift transition-all"
                  >
                    <div className={`${p.imageStyle}`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-wood-dark/85 p-3 flex flex-col justify-end text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-display text-sm font-medium">{p.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
                Отзывы{' '}
                <em className="italic text-amber-deep font-medium">
                  ({reviews.length})
                </em>
              </h2>
              <button
                onClick={() => showToast('Форма отзыва')}
                className="text-sm font-semibold border-b border-current pb-0.5"
              >
                Оставить отзыв →
              </button>
            </div>
            {reviewsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="card p-8 text-center text-ink-muted">
                Пока нет отзывов. Будьте первым!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <article key={r.id} className="card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-bg-warm grid place-items-center font-display font-bold text-base shrink-0">
                        {r.authorInitial}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <strong className="font-semibold">{r.authorName}</strong>
                          <span className="text-xs text-ink-muted">
                            {timeAgo(r.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={cn(
                                i < r.rating
                                  ? 'fill-amber text-amber'
                                  : 'text-line'
                              )}
                            />
                          ))}
                          {r.projectTitle && (
                            <span className="text-xs text-ink-muted ml-2">
                              · {r.projectTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-ink-soft leading-relaxed text-[14px] mb-3">
                      {r.text}
                    </p>
                    {r.helpful !== undefined && (
                      <button
                        onClick={() => showToast('Спасибо за оценку!')}
                        className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                      >
                        <ThumbsUp size={12} />
                        Полезно ({r.helpful})
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          {/* Contacts */}
          <div className="card p-5">
            <h4 className="font-display text-lg font-semibold mb-4">Контакты</h4>
            <div className="space-y-3 text-sm">
              {master.phone && (
                <ContactRow icon={<Phone size={14} />} label="Телефон">
                  <a href={`tel:${master.phone}`} className="hover:text-amber-deep">
                    {master.phone}
                  </a>
                </ContactRow>
              )}
              {master.whatsapp && (
                <ContactRow icon={<MessageCircle size={14} />} label="WhatsApp">
                  <a
                    href={`https://wa.me/${master.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-amber-deep"
                  >
                    {master.whatsapp}
                  </a>
                </ContactRow>
              )}
              {master.workingHours && (
                <ContactRow icon={<Clock size={14} />} label="График">
                  {master.workingHours}
                </ContactRow>
              )}
              {master.address && (
                <ContactRow icon={<MapPin size={14} />} label="Адрес">
                  {master.address}
                </ContactRow>
              )}
            </div>
            {master.responseTime && (
              <div className="mt-4 pt-4 border-t border-line-soft text-xs text-moss flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
                {master.responseTime}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="bg-wood-dark text-paper p-5 rounded-2xl">
            <h4 className="font-display text-lg italic font-medium text-amber-soft mb-2">
              Есть проект?
            </h4>
            <p className="text-xs text-paper/70 mb-4 leading-relaxed">
              Напишите мастеру или прикрепите готовый эскиз из конструктора.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => showToast('Открываем чат...')}
                className="w-full bg-amber text-paper py-2.5 rounded-lg text-[13px] font-bold hover:bg-amber-deep transition-colors"
              >
                Написать мастеру
              </button>
              <Link
                to="/constructor"
                className="block w-full bg-paper/10 text-paper py-2.5 rounded-lg text-[13px] font-semibold hover:bg-paper/20 transition-colors text-center"
              >
                Создать проект →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatCard({
  num,
  label,
  icon,
  amber,
}: {
  num: string
  label: string
  icon?: React.ReactNode
  amber?: boolean
}) {
  return (
    <div className="bg-paper p-5 transition-colors hover:bg-bg-warm">
      <div
        className={cn(
          'font-display text-3xl font-medium tracking-tight leading-none mb-1.5 flex items-center gap-2',
          amber && 'text-amber-deep'
        )}
      >
        {icon}
        {num}
      </div>
      <div className="text-[13px] text-ink-muted">{label}</div>
    </div>
  )
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-bg-warm grid place-items-center text-ink-muted shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider mb-0.5">
          {label}
        </div>
        <div className="font-medium break-words">{children}</div>
      </div>
    </div>
  )
}

function pluralYears(n: number): string {
  if (n === 1) return 'год'
  if (n >= 2 && n <= 4) return 'года'
  return 'лет'
}
