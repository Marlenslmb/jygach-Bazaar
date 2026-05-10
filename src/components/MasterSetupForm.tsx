import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const SPECIALIZATIONS = [
  'Кухонные гарнитуры', 'Шкафы-купе', 'Корпусная мебель',
  'Мебель из массива', 'Мягкая мебель', 'Офисная мебель',
  'Детская мебель', 'Встроенная мебель', 'Реставрация',
]

const TAGS_LIST = [
  'ЛДСП', 'МДФ', 'Массив', 'Дуб', 'Орех', 'Сосна',
  'Покраска', 'Шпон', 'Фасады', 'Фурнитура Blum',
]

interface Props {
  onComplete: () => void
}

export function MasterSetupForm({ onComplete }: Props) {
  const showToast = useAppStore(s => s.showToast)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    specialization: '',
    years_exp: '',
    tags: [] as string[],
    bio: '',
    whatsapp: '',
    address: '',
    working_hours: '',
    response_time: 'В течение часа',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleTag = (tag: string) => set('tags',
    form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]
  )

  const save = async () => {
    if (!form.specialization) { showToast('Укажите специализацию'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      // Создаём запись мастера
      const { error } = await supabase.from('master_profiles').upsert({
        id: user.id,
        specialization: form.specialization,
        years_exp: parseInt(form.years_exp) || 0,
        tags: form.tags,
        working_hours: form.working_hours || null,
        address: form.address || null,
        whatsapp: form.whatsapp || null,
        response_time: form.response_time,
        rating: 0,
        projects_count: 0,
        cover_color: Math.ceil(Math.random() * 6),
      })

      if (error) throw error

      // Обновляем bio в profiles
      if (form.bio) {
        await supabase.from('profiles').update({ bio: form.bio }).eq('id', user.id)
      }

      showToast('Профиль мастера создан ✓')
      onComplete()
    } catch (e: any) {
      showToast(e.message ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-soft rounded-full grid place-items-center mx-auto mb-4">
          <ChefHat size={28} className="text-amber-deep" />
        </div>
        <h2 className="font-display text-2xl font-semibold">Расскажите о себе</h2>
        <p className="text-ink-muted text-sm mt-1">
          Заполните профиль чтобы заказчики могли вас найти
        </p>
      </div>

      {/* Шаги */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full grid place-items-center text-sm font-bold transition-all',
              step >= s ? 'bg-wood-dark text-paper' : 'bg-bg-warm text-ink-muted'
            )}>
              {step > s ? <Check size={14} /> : s}
            </div>
            {s < 2 && <div className={cn('flex-1 h-0.5', step > s ? 'bg-wood-dark' : 'bg-line')} style={{width: '80px'}} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-ink-muted">
          {step === 1 ? 'Специализация' : 'Контакты'}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          {/* Специализация */}
          <div>
            <label className="field-label">Специализация *</label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATIONS.map(s => (
                <button key={s} onClick={() => set('specialization', s)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all',
                    form.specialization === s
                      ? 'border-amber-deep bg-amber-soft text-amber-deep'
                      : 'border-line text-ink-soft hover:border-ink-muted'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Опыт */}
          <div>
            <label className="field-label">Лет опыта</label>
            <input type="number" value={form.years_exp}
              onChange={e => set('years_exp', e.target.value)}
              placeholder="5" min="0" max="50" className="form-input" />
          </div>

          {/* Теги */}
          <div>
            <label className="field-label">С чем работаете (выберите все подходящие)</label>
            <div className="flex flex-wrap gap-2">
              {TAGS_LIST.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                    form.tags.includes(tag)
                      ? 'bg-wood-dark text-paper border-wood-dark'
                      : 'border-line text-ink-soft hover:border-ink-muted'
                  )}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* О себе */}
          <div>
            <label className="field-label">О себе</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              rows={3} className="form-input resize-none"
              placeholder="Занимаюсь изготовлением мебели на заказ уже 10 лет..." />
          </div>

          <button
            onClick={() => { if (!form.specialization) { showToast('Выберите специализацию'); return } setStep(2) }}
            className="w-full py-3.5 rounded-xl bg-wood-dark text-paper font-bold hover:bg-amber-deep transition-colors">
            Далее →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="field-label">WhatsApp</label>
            <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
              placeholder="+996 555 000 000" className="form-input" />
          </div>
          <div>
            <label className="field-label">Адрес мастерской</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Бишкек, мкр Аламедин" className="form-input" />
          </div>
          <div>
            <label className="field-label">Часы работы</label>
            <input value={form.working_hours} onChange={e => set('working_hours', e.target.value)}
              placeholder="Пн–Пт 9:00–18:00" className="form-input" />
          </div>
          <div>
            <label className="field-label">Время ответа</label>
            <select value={form.response_time} onChange={e => set('response_time', e.target.value)} className="form-input">
              {['В течение часа', 'В течение нескольких часов', 'В течение дня', 'В течение 2-3 дней'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-line font-semibold text-sm hover:bg-bg-warm">
              ← Назад
            </button>
            <button onClick={save} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-wood-dark text-paper font-bold text-sm hover:bg-amber-deep disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Создать профиль ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
