import { useState } from 'react'
import { X, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const CATEGORIES = [
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

const UNITS = ['лист', 'м²', 'м', 'шт', 'кг', 'рулон', 'упак']

interface Props {
  onClose: () => void
  onSuccess: () => void
  editItem?: any
}

export function AddMaterialModal({ onClose, onSuccess, editItem }: Props) {
  const showToast = useAppStore(s => s.showToast)
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:       editItem?.title       ?? '',
    category:    editItem?.category    ?? 'ldsp',
    price:       editItem?.price       ?? '',
    unit:        editItem?.unit        ?? 'лист',
    discount:    editItem?.discount    ?? '',
    description: editItem?.description ?? '',
    origin:      editItem?.origin      ?? '',
    warranty:    editItem?.warranty    ?? '',
    min_order:   editItem?.min_order   ?? '',
    in_stock:    editItem?.in_stock    ?? true,
    is_new:      editItem?.is_new      ?? false,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title || !form.price) {
      showToast('Заполните название и цену')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const payload = {
        supplier_id: user.id,
        title:       form.title,
        category:    form.category,
        price:       Number(form.price),
        unit:        form.unit,
        discount:    form.discount ? Number(form.discount) : 0,
        description: form.description || null,
        origin:      form.origin || null,
        warranty:    form.warranty || null,
        min_order:   form.min_order || null,
        in_stock:    form.in_stock,
        is_new:      form.is_new,
      }

      if (editItem) {
        await supabase.from('materials').update(payload).eq('id', editItem.id)
        showToast('Материал обновлён ✓')
      } else {
        await supabase.from('materials').insert(payload)
        showToast('Материал добавлен ✓')
      }

      qc.invalidateQueries({ queryKey: ['my-materials'] })
      qc.invalidateQueries({ queryKey: ['materials'] })
      onSuccess()
    } catch (e: any) {
      showToast(e.message ?? 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-wood-dark/40 backdrop-blur-sm">
      <div className="bg-paper rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-lift max-h-[90vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between p-5 border-b border-line-soft shrink-0">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-amber-deep" />
            <h3 className="font-display text-lg font-semibold">
              {editItem ? 'Редактировать' : 'Добавить материал'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-bg-warm grid place-items-center hover:bg-line-soft">
            <X size={16} />
          </button>
        </div>

        {/* Форма */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Название */}
          <div>
            <label className="field-label">Название *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="ЛДСП 16мм Дуб Сонома" className="form-input" />
          </div>

          {/* Категория */}
          <div>
            <label className="field-label">Категория *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => set('category', c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                    form.category === c.id ? 'bg-wood-dark text-paper border-wood-dark' : 'border-line text-ink-soft hover:border-ink-muted'
                  )}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Цена + единица */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Цена (сом) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="1500" className="form-input" />
            </div>
            <div>
              <label className="field-label">Единица</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="form-input">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Скидка */}
          <div>
            <label className="field-label">Скидка (%)</label>
            <input type="number" value={form.discount} onChange={e => set('discount', e.target.value)}
              placeholder="0" min="0" max="100" className="form-input" />
          </div>

          {/* Описание */}
          <div>
            <label className="field-label">Описание</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} className="form-input resize-none"
              placeholder="Ламинированная ДСП, влагостойкое покрытие..." />
          </div>

          {/* Доп. поля */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Страна происхождения</label>
              <input value={form.origin} onChange={e => set('origin', e.target.value)}
                placeholder="Беларусь" className="form-input" />
            </div>
            <div>
              <label className="field-label">Гарантия</label>
              <input value={form.warranty} onChange={e => set('warranty', e.target.value)}
                placeholder="12 месяцев" className="form-input" />
            </div>
          </div>

          <div>
            <label className="field-label">Минимальный заказ</label>
            <input value={form.min_order} onChange={e => set('min_order', e.target.value)}
              placeholder="от 5 листов" className="form-input" />
          </div>

          {/* Переключатели */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)}
                className="w-4 h-4 accent-amber-deep" />
              <span className="text-sm font-medium">В наличии</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_new} onChange={e => set('is_new', e.target.checked)}
                className="w-4 h-4 accent-amber-deep" />
              <span className="text-sm font-medium">Новинка</span>
            </label>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 p-5 border-t border-line-soft shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-line font-semibold text-sm hover:bg-bg-warm">
            Отмена
          </button>
          <button onClick={save} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-wood-dark text-paper font-bold text-sm hover:bg-amber-deep disabled:opacity-50">
            {loading ? 'Сохранение...' : editItem ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}
