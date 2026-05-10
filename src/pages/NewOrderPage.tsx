import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  ChefHat,
  DoorOpen,
  Bed,
  Sofa,
  Briefcase,
  Baby,
  LayoutGrid,
  HelpCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Paperclip,
  MapPin,
} from 'lucide-react'
import { ordersApi } from '@/api/client'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { cn, formatShortPrice } from '@/lib/utils'
import type { FurnitureCategory, City } from '@/api/types'

// ——— Step types ———
type Step = 'category' | 'details' | 'requirements' | 'budget' | 'preview'
const STEPS: Step[] = ['category', 'details', 'requirements', 'budget', 'preview']
const STEP_LABELS: Record<Step, string> = {
  category: 'Категория',
  details: 'Описание',
  requirements: 'Требования',
  budget: 'Бюджет',
  preview: 'Проверка',
}

// ——— Form state ———
interface FormState {
  category: FurnitureCategory | ''
  title: string
  description: string
  city: City
  district: string
  deadlineWeeks: number
  requirements: string[]
  preferredMaterials: string[]
  budget: number
  hasAttachment: boolean
}

const INITIAL: FormState = {
  category: '',
  title: '',
  description: '',
  city: 'Бишкек',
  district: '',
  deadlineWeeks: 3,
  requirements: [],
  preferredMaterials: [],
  budget: 0,
  hasAttachment: false,
}

// ——— Category options ———
const CATEGORIES: { id: FurnitureCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'kitchen', label: 'Кухня', icon: <ChefHat size={28} /> },
  { id: 'wardrobe', label: 'Шкаф-купе', icon: <DoorOpen size={28} /> },
  { id: 'bedroom', label: 'Спальня', icon: <Bed size={28} /> },
  { id: 'living', label: 'Гостиная', icon: <Sofa size={28} /> },
  { id: 'office', label: 'Офис', icon: <Briefcase size={28} /> },
  { id: 'kids', label: 'Детская', icon: <Baby size={28} /> },
  { id: 'hallway', label: 'Прихожая', icon: <LayoutGrid size={28} /> },
  { id: 'other', label: 'Другое', icon: <HelpCircle size={28} /> },
]

const CITIES: City[] = ['Бишкек', 'Ош', 'Каракол', 'Джалал-Абад', 'Токмок', 'Нарын', 'Талас']

const SUGGESTION_REQS: Record<FurnitureCategory, string[]> = {
  kitchen: ['МДФ матовый', 'Встройка техники', 'Подсветка рабочей зоны', 'Столешница под камень', 'До потолка'],
  wardrobe: ['Зеркало во всю дверь', 'Штанга для одежды', 'Выдвижные ящики', 'ЛДСП'],
  bedroom: ['Подъёмный механизм кровати', 'Тумбочки', 'Зеркало', 'Мягкое изголовье'],
  living: ['Ниша под ТВ', 'Открытые полки', 'Подсветка', 'Закрытые шкафчики'],
  office: ['Ящики для документов', 'Кабель-менеджмент', 'Надстройка', 'Эргономика'],
  kids: ['Безопасные материалы', 'Двухъярусная кровать', 'Место для учёбы', 'Много хранения'],
  hallway: ['Вешалка', 'Полка для обуви', 'Зеркало', 'Скамейка с ящиком'],
  other: [],
}

export function NewOrderPage() {
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const [step, setStep] = useState<Step>('category')
  const [form, setForm] = useState<FormState>(INITIAL)
  const [reqInput, setReqInput] = useState('')
  const [matInput, setMatInput] = useState('')

  const stepIdx = STEPS.indexOf(step)

  const patch = (updates: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...updates }))

  // Добавить/убрать требование
  const toggleReq = (r: string) => {
    patch({
      requirements: form.requirements.includes(r)
        ? form.requirements.filter((x) => x !== r)
        : [...form.requirements, r],
    })
  }
  const addReqInput = () => {
    const v = reqInput.trim()
    if (v && !form.requirements.includes(v)) {
      patch({ requirements: [...form.requirements, v] })
    }
    setReqInput('')
  }
  const addMatInput = () => {
    const v = matInput.trim()
    if (v && !form.preferredMaterials.includes(v)) {
      patch({ preferredMaterials: [...form.preferredMaterials, v] })
    }
    setMatInput('')
  }

  const canNext = (): boolean => {
    if (step === 'category') return !!form.category
    if (step === 'details') return !!form.title.trim() && !!form.description.trim()
    if (step === 'budget') return form.budget > 0
    return true
  }

  const goNext = () => {
    if (!canNext()) { showToast('Заполните обязательные поля'); return }
    const next = STEPS[stepIdx + 1]
    if (next) setStep(next)
  }
  const goPrev = () => {
    const prev = STEPS[stepIdx - 1]
    if (prev) setStep(prev)
  }

  // Отправка
  const createMutation = useMutation({
    mutationFn: () =>
      ordersApi.create({
        title: form.title,
        description: form.description,
        category: form.category as FurnitureCategory,
        city: form.city,
        district: form.district || undefined,
        budget: form.budget,
        deadlineWeeks: form.deadlineWeeks,
        requirements: form.requirements,
        preferredMaterials: form.preferredMaterials,
      }),
    onSuccess: (order) => {
      showToast('Заявка опубликована! Ждите откликов.')
      navigate(`/orders/${order.id}`)
    },
    onError: (err: any) => {
      if (err?.message?.includes('авторизован')) {
        showToast('Войдите чтобы опубликовать заказ')
        navigate('/auth')
      } else {
        showToast('Ошибка публикации. Попробуйте ещё раз.')
      }
    },
  })

  const suggestions = form.category ? (SUGGESTION_REQS[form.category] ?? []) : []

  return (
    <div className="animate-page-in max-w-2xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Заказы', to: '/orders' },
          { label: 'Новый заказ' },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-none mb-2">
          Новый <em className="italic text-amber-deep font-medium">заказ</em>
        </h1>
        <p className="text-ink-muted">
          Опишите, что хотите — мастера сами предложат цену и срок
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < stepIdx && setStep(s)}
              className={cn(
                'flex flex-col items-center gap-1.5 group',
                i <= stepIdx ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full grid place-items-center font-bold text-sm transition-all',
                  i < stepIdx && 'bg-moss text-paper',
                  i === stepIdx && 'bg-wood-dark text-paper shadow-lift scale-110',
                  i > stepIdx && 'bg-bg-warm text-ink-muted'
                )}
              >
                {i < stepIdx ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider hidden sm:block',
                  i === stepIdx ? 'text-ink' : 'text-ink-muted'
                )}
              >
                {STEP_LABELS[s]}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-2 transition-colors',
                  i < stepIdx ? 'bg-moss' : 'bg-line'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ===== STEP: CATEGORY ===== */}
      {step === 'category' && (
        <StepCard title="Что хотите заказать?">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  patch({ category: cat.id, title: cat.label })
                  // Авто-переход если уже выбрано
                  setTimeout(() => setStep('details'), 200)
                }}
                className={cn(
                  'flex flex-col items-center gap-2 py-5 px-3 rounded-xl border-2 transition-all hover:-translate-y-0.5',
                  form.category === cat.id
                    ? 'border-amber-deep bg-amber-soft text-amber-deep'
                    : 'border-line bg-paper text-ink-soft hover:border-ink-muted'
                )}
              >
                {cat.icon}
                <span className="text-sm font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* ===== STEP: DETAILS ===== */}
      {step === 'details' && (
        <StepCard title="Расскажите подробнее">
          <div className="space-y-4">
            <div>
              <Label>Название заявки *</Label>
              <input
                className="form-input"
                placeholder={`Например: ${form.category === 'kitchen' ? 'Угловая кухня 3.6м' : 'Шкаф-купе в прихожую'}`}
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Описание *</Label>
              <textarea
                className="form-input resize-none"
                rows={4}
                placeholder="Опишите что хотите: стиль, примерные размеры, особые пожелания..."
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Город *</Label>
                <select
                  className="form-input"
                  value={form.city}
                  onChange={(e) => patch({ city: e.target.value as City })}
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Район / микрорайон</Label>
                <input
                  className="form-input"
                  placeholder="Джал, 7 мкр..."
                  value={form.district}
                  onChange={(e) => patch({ district: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Желаемый срок</Label>
              <div className="flex items-center gap-3 mt-1">
                {[1, 2, 3, 4, 6, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => patch({ deadlineWeeks: w })}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                      form.deadlineWeeks === w
                        ? 'bg-wood-dark text-paper border-wood-dark'
                        : 'bg-paper border-line text-ink-soft hover:border-ink-muted'
                    )}
                  >
                    {w} нед
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Прикрепить проект из конструктора</Label>
              <button
                onClick={() => {
                  patch({ hasAttachment: !form.hasAttachment })
                  showToast(form.hasAttachment ? 'Проект откреплён' : 'Проект прикреплён')
                }}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                  form.hasAttachment
                    ? 'border-amber-deep bg-amber-soft text-amber-deep'
                    : 'border-line bg-paper text-ink-soft hover:border-ink-muted'
                )}
              >
                <Paperclip size={15} />
                {form.hasAttachment ? 'Эскиз прикреплён ✓' : 'Прикрепить эскиз'}
              </button>
            </div>
          </div>
        </StepCard>
      )}

      {/* ===== STEP: REQUIREMENTS ===== */}
      {step === 'requirements' && (
        <StepCard title="Требования и материалы" subtitle="Необязательно, но помогает мастерам понять задачу точнее">
          <div className="space-y-6">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <Label>Частые пожелания для «{CATEGORIES.find(c=>c.id===form.category)?.label}»</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleReq(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5',
                        form.requirements.includes(s)
                          ? 'bg-wood-dark text-paper border-wood-dark'
                          : 'bg-paper border-line text-ink-soft hover:border-ink-muted'
                      )}
                    >
                      {form.requirements.includes(s) && <Check size={11} />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom requirements */}
            <div>
              <Label>Свои требования</Label>
              <div className="flex gap-2 mt-1">
                <input
                  className="form-input flex-1"
                  placeholder="Добавить требование..."
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addReqInput()}
                />
                <button
                  onClick={addReqInput}
                  className="w-10 h-10 rounded-xl bg-bg-warm grid place-items-center hover:bg-wood-dark hover:text-paper transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {form.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.requirements.map((r) => (
                    <span
                      key={r}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-warm rounded-full text-xs font-medium"
                    >
                      {r}
                      <button onClick={() => toggleReq(r)} className="hover:text-amber-deep">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred materials */}
            <div>
              <Label>Предпочтительные материалы</Label>
              <div className="flex gap-2 mt-1">
                <input
                  className="form-input flex-1"
                  placeholder="МДФ, дуб, ЛДСП Egger..."
                  value={matInput}
                  onChange={(e) => setMatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMatInput()}
                />
                <button
                  onClick={addMatInput}
                  className="w-10 h-10 rounded-xl bg-bg-warm grid place-items-center hover:bg-wood-dark hover:text-paper transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {form.preferredMaterials.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.preferredMaterials.map((m) => (
                    <span
                      key={m}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-soft text-amber-deep rounded-full text-xs font-medium"
                    >
                      {m}
                      <button onClick={() => patch({ preferredMaterials: form.preferredMaterials.filter(x=>x!==m) })} className="hover:text-amber-deep">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </StepCard>
      )}

      {/* ===== STEP: BUDGET ===== */}
      {step === 'budget' && (
        <StepCard title="Ваш бюджет">
          <div className="space-y-6">
            <div>
              <Label>Сумма в сомах *</Label>
              <div className="relative mt-1">
                <input
                  type="number"
                  className="form-input pr-14 text-xl font-display font-semibold"
                  placeholder="0"
                  value={form.budget || ''}
                  onChange={(e) => patch({ budget: parseInt(e.target.value) || 0 })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted font-medium">
                  сом
                </span>
              </div>
              {form.budget > 0 && (
                <div className="text-sm text-ink-muted mt-1">
                  ≈ {formatShortPrice(form.budget)} сом
                </div>
              )}
            </div>

            {/* Quick picks */}
            <div>
              <Label>Быстрый выбор</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {[30000, 60000, 100000, 150000, 200000, 300000].map((b) => (
                  <button
                    key={b}
                    onClick={() => patch({ budget: b })}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-semibold transition-all',
                      form.budget === b
                        ? 'bg-wood-dark text-paper border-wood-dark'
                        : 'bg-paper border-line text-ink-soft hover:border-ink-muted'
                    )}
                  >
                    {formatShortPrice(b)} сом
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-bg-warm rounded-xl p-4 text-sm text-ink-muted leading-relaxed">
              💡 Укажите реальный бюджет — мастера предложат оптимальный вариант. Если не уверены, поставьте максимум, который готовы потратить.
            </div>
          </div>
        </StepCard>
      )}

      {/* ===== STEP: PREVIEW ===== */}
      {step === 'preview' && (
        <StepCard title="Проверьте заявку">
          <div className="space-y-4">
            {/* Preview card */}
            <div className="border border-line rounded-xl overflow-hidden">
              <div className="bg-bg-warm px-5 py-3 border-b border-line">
                <div className="text-xs text-ink-muted uppercase tracking-wider">
                  {CATEGORIES.find(c=>c.id===form.category)?.label}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl font-semibold mb-2">{form.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted mb-3">
                  <span className="flex items-center gap-1"><MapPin size={13}/> {form.city}{form.district && `, ${form.district}`}</span>
                  <span>📅 Срок: {form.deadlineWeeks} нед</span>
                </div>
                <p className="text-ink-soft text-sm leading-relaxed mb-4">{form.description}</p>

                {form.requirements.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Требования</div>
                    <div className="flex flex-wrap gap-1.5">
                      {form.requirements.map(r=>(
                        <span key={r} className="px-2.5 py-1 bg-bg-warm rounded-full text-xs font-medium">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {form.hasAttachment && (
                  <div className="flex items-center gap-2 text-sm text-amber-deep mb-3">
                    <Paperclip size={13}/> Эскиз из конструктора прикреплён
                  </div>
                )}

                <div className="pt-3 border-t border-line-soft flex justify-between items-center">
                  <span className="text-sm text-ink-muted">Бюджет</span>
                  <span className="font-display text-2xl font-semibold text-amber-deep">
                    {formatShortPrice(form.budget)} сом
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-ink-muted leading-relaxed bg-bg-warm rounded-xl p-4">
              После публикации мастера увидят вашу заявку и начнут присылать предложения. Вы получите уведомление в разделе «Сообщения».
            </div>
          </div>
        </StepCard>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={step === 'category' ? () => navigate('/orders') : goPrev}
          className="flex items-center gap-2 px-5 py-3 rounded-full border border-line text-sm font-semibold text-ink-soft hover:bg-bg-warm transition-colors"
        >
          <ChevronLeft size={16} />
          {step === 'category' ? 'Отмена' : 'Назад'}
        </button>

        {step !== 'preview' ? (
          <button
            onClick={goNext}
            disabled={!canNext()}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all',
              canNext()
                ? 'bg-wood-dark text-paper hover:bg-amber-deep hover:-translate-y-0.5'
                : 'bg-bg-warm text-ink-muted cursor-not-allowed'
            )}
          >
            Далее
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber-deep text-paper text-sm font-bold hover:bg-amber-deep/90 hover:-translate-y-0.5 transition-all disabled:opacity-60"
          >
            {createMutation.isPending ? 'Публикация...' : 'Опубликовать заявку'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function StepCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="animate-page-in">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
      {children}
    </div>
  )
}
