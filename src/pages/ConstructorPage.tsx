import { useReducer, useRef, useCallback, lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Undo2, Redo2, Trash2, ChefHat, DoorOpen, Bed,
  Sofa, LayoutGrid, Save, SendHorizonal, Lightbulb,
  PanelLeft, Copy, RotateCcw, Box, PenLine, Plus,
  Download, FileImage, Settings, Layers,
} from 'lucide-react'
import { constructorReducer, INITIAL_STATE, MATERIALS } from './constructor/types'
import type { MaterialId, ElementType } from './constructor/types'
import { ConstructorCanvas } from './constructor/ConstructorCanvas'
import { useExport } from './constructor/useExport'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatShortPrice } from '@/lib/utils'

const Constructor3DScene = lazy(() =>
  import('./constructor/Constructor3DScene').then((m) => ({ default: m.Constructor3DScene }))
)

const PRESETS = [
  { id: 'wardrobe' as const, label: 'Шкаф',    icon: <DoorOpen size={14} /> },
  { id: 'kitchen'  as const, label: 'Кухня',   icon: <ChefHat size={14} /> },
  { id: 'shelf'    as const, label: 'Стеллаж', icon: <LayoutGrid size={14} /> },
  { id: 'table'    as const, label: 'Стол',    icon: <Sofa size={14} /> },
  { id: 'desk'     as const, label: 'Комп. стол', icon: <Sofa size={14} /> },
  { id: 'bed'      as const, label: 'Кровать', icon: <Bed size={14} /> },
  { id: 'vanity'   as const, label: 'Тумба',   icon: <LayoutGrid size={14} /> },
  { id: 'chair'    as const, label: 'Стул',    icon: <Sofa size={14} /> },
]

const ADD_ELEMENTS: { type: ElementType; label: string; defaultW: number; defaultH: number }[] = [
  { type: 'shelf',   label: 'Полка',       defaultW: 600, defaultH: 18  },
  { type: 'drawer',  label: 'Ящик',        defaultW: 600, defaultH: 160 },
  { type: 'door',    label: 'Дверца',      defaultW: 400, defaultH: 800 },
  { type: 'divider', label: 'Разделитель', defaultW: 18,  defaultH: 600 },
  { type: 'rod',     label: 'Штанга',      defaultW: 600, defaultH: 30  },
  { type: 'mirror',  label: 'Зеркало',     defaultW: 400, defaultH: 600 },
]

// Мобильные вкладки
type MobileTab = 'canvas' | 'templates' | 'elements' | 'settings'

export function ConstructorPage() {
  const [state, dispatch] = useReducer(constructorReducer, INITIAL_STATE)
  const svgRef = useRef<SVGSVGElement>(null)
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const { exportPng, exportPdf } = useExport(state)
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas')

  const selectedEl = state.elements.find((e) => e.id === state.selectedId)
  const mat = MATERIALS[state.material]
  const is3d = state.viewMode === 'iso'

  const saveProject = useCallback(() => {
    localStorage.setItem('jb-constructor-project', JSON.stringify(state))
    showToast('Проект сохранён ✓')
  }, [state, showToast])

  const handleDuplicate = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_ELEMENT', id })
    showToast('Элемент дублирован')
  }, [dispatch, showToast])

  const area = (state.totalWidth * state.totalHeight) / 1_000_000
  const matCost   = Math.round(area * 16000)
  const laborCost = Math.round(matCost * 0.6)
  const extras    = (state.hasLighting ? 8000 : 0) + (state.hasBackPanel ? 3500 : 0)
  const total     = matCost + laborCost + extras
  const nonBody   = state.elements.filter((e) => e.id !== 'body')

  const addElement = (el: typeof ADD_ELEMENTS[0]) => {
    const body = state.elements.find((e) => e.id === 'body')
    dispatch({
      type: 'ADD_ELEMENT',
      element: {
        type: el.type,
        x: body ? Math.max(0, Math.round((body.w - el.defaultW) / 2)) : 100,
        y: body ? Math.round(body.h / 2) : 200,
        w: el.defaultW, h: el.defaultH, label: el.label,
      },
    })
    setMobileTab('canvas')
  }

  // ─── Левая панель (шаблоны + материалы) ───
  const LeftPanel = () => (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3 md:p-0">
      <Panel title="Шаблон">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.id}
              onClick={() => { dispatch({ type: 'LOAD_PRESET', preset: p.id }); showToast(`«${p.label}» загружен`); setMobileTab('canvas') }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-bg-warm hover:bg-line-soft text-xs font-semibold text-left transition-colors">
              <span className="text-amber-deep shrink-0">{p.icon}</span>
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Материал">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {Object.values(MATERIALS).map((m) => (
            <button key={m.id}
              onClick={() => dispatch({ type: 'SET_MATERIAL', material: m.id as MaterialId })}
              title={m.label}
              className={cn('aspect-square rounded-lg border-2 transition-all',
                state.material === m.id ? 'border-amber-deep scale-105 shadow-sm' : 'border-transparent hover:border-ink-muted')}
              style={{ background: m.fill }} />
          ))}
        </div>
        <div className="text-center text-[11px] font-semibold text-ink-muted py-1 bg-bg-warm rounded-lg">{mat.label}</div>
      </Panel>
    </div>
  )

  // ─── Панель добавления элементов ───
  const ElementsPanel = () => (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3 md:p-0">
      <Panel title="Добавить элемент">
        <div className="grid grid-cols-2 gap-1.5">
          {ADD_ELEMENTS.map((el) => (
            <button key={el.type} onClick={() => addElement(el)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-bg-warm hover:bg-line-soft text-xs font-medium text-left transition-colors">
              <Plus size={12} className="text-amber-deep shrink-0" />
              {el.label}
            </button>
          ))}
        </div>
      </Panel>
      {nonBody.length > 0 && (
        <Panel title={`Элементы (${nonBody.length})`}>
          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {nonBody.map((el) => (
              <button key={el.id}
                onClick={() => { dispatch({ type: 'SELECT', id: el.id }); setMobileTab('canvas') }}
                className={cn('flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors',
                  state.selectedId === el.id ? 'bg-amber-soft text-amber-deep font-bold' : 'hover:bg-bg-warm text-ink-soft')}>
                <span>{el.label || el.type}</span>
                <span className="opacity-50">{el.w}×{el.h}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )

  // ─── Правая панель (параметры + смета) ───
  const SettingsPanel = () => (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3 md:p-0">
      {selectedEl && selectedEl.id !== 'body' ? (
        <Panel title={`✦ ${selectedEl.label || selectedEl.type}`}>
          {[
            { label: 'Ширина (мм)', val: selectedEl.w, onC: (v: number) => dispatch({ type: 'RESIZE_ELEMENT', id: selectedEl.id, w: v, h: selectedEl.h }) },
            { label: 'Высота (мм)', val: selectedEl.h, onC: (v: number) => dispatch({ type: 'RESIZE_ELEMENT', id: selectedEl.id, w: selectedEl.w, h: v }) },
            { label: 'X (мм)',       val: selectedEl.x, onC: (v: number) => dispatch({ type: 'MOVE_ELEMENT', id: selectedEl.id, x: v, y: selectedEl.y }) },
            { label: 'Y (мм)',       val: selectedEl.y, onC: (v: number) => dispatch({ type: 'MOVE_ELEMENT', id: selectedEl.id, x: selectedEl.x, y: v }) },
          ].map(({ label, val, onC }) => <PropRow key={label} label={label} value={val} onChange={onC} />)}
          <div className="flex gap-2 mt-3">
            <button onClick={() => handleDuplicate(selectedEl.id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-bg-warm text-xs font-semibold hover:bg-line-soft">
              <Copy size={11} /> Дублировать
            </button>
            <button onClick={() => { dispatch({ type: 'DELETE_ELEMENT', id: selectedEl.id }); showToast('Удалён') }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-red-200 text-red-400 text-xs font-semibold hover:bg-red-50">
              <Trash2 size={11} /> Удалить
            </button>
          </div>
        </Panel>
      ) : (
        <Panel title="Параметры">
          <div className="flex justify-between items-center py-2 border-b border-line-soft">
            <span className="text-[11px] text-ink-muted">Толщина плиты</span>
            <select value={state.boardThickness}
              onChange={(e) => dispatch({ type: 'SET_BOARD_THICKNESS', value: parseInt(e.target.value) })}
              className="text-xs font-bold bg-bg-warm border border-line rounded-md px-2 py-1 focus:outline-none">
              {[10, 16, 18, 22, 25].map((v) => <option key={v} value={v}>{v} мм</option>)}
            </select>
          </div>
          <SwitchRow label="LED подсветка" hint={state.hasLighting ? 'Включена' : 'Выключена'} icon={<Lightbulb size={12} />}
            checked={state.hasLighting} onChange={() => dispatch({ type: 'TOGGLE_LIGHTING' })} onColor="bg-amber" />
          <SwitchRow label="Задняя стенка" hint={state.hasBackPanel ? 'Есть' : 'Без стенки'} icon={<PanelLeft size={12} />}
            checked={state.hasBackPanel} onChange={() => dispatch({ type: 'TOGGLE_BACK_PANEL' })} onColor="bg-moss" />
        </Panel>
      )}
      <Panel title="Смета">
        <CostLine label="Материалы" value={matCost} />
        <CostLine label="Работа" value={laborCost} />
        {state.hasLighting  && <CostLine label="Подсветка" value={8000} accent />}
        {state.hasBackPanel && <CostLine label="Задняя стенка" value={3500} accent />}
        <div className="pt-2 mt-1 border-t border-line-soft flex justify-between items-center">
          <span className="font-bold text-sm">Итого ~</span>
          <span className="font-display text-xl font-semibold text-amber-deep">{formatShortPrice(total)} с</span>
        </div>
      </Panel>
      <div className="bg-wood-dark text-paper p-4 rounded-xl flex flex-col gap-2">
        <button onClick={() => { saveProject(); navigate('/orders/new') }}
          className="flex items-center justify-center gap-1.5 w-full bg-amber text-paper py-2.5 rounded-lg text-xs font-bold hover:bg-amber-deep">
          <SendHorizonal size={13} /> Опубликовать заказ
        </button>
        <button onClick={() => exportPdf()}
          className="flex items-center justify-center gap-1.5 w-full bg-paper/10 text-paper py-2 rounded-lg text-xs font-semibold hover:bg-paper/20">
          <Download size={12} /> PDF чертёж
        </button>
      </div>
    </div>
  )

  return (
    <div className="animate-page-in flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>

      {/* ── Шапка ── */}
      <div className="flex items-center justify-between py-2 shrink-0 gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-none">
            Конструктор <em className="italic text-amber-deep font-medium">мебели</em>
          </h1>
          <p className="text-[11px] text-ink-muted mt-0.5 hidden md:block">
            Drag — переместить · Углы — ресайз · ПКМ — меню · Del · Ctrl+Z · Ctrl+D
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex bg-bg-warm border border-line rounded-xl p-1 gap-1">
            <button onClick={() => dispatch({ type: 'TOGGLE_VIEW_MODE' })}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                !is3d ? 'bg-wood-dark text-paper shadow-sm' : 'text-ink-soft hover:text-ink')}>
              <PenLine size={12} /> <span className="hidden sm:inline">2D</span>
            </button>
            <button onClick={() => dispatch({ type: 'TOGGLE_VIEW_MODE' })}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                is3d ? 'bg-wood-dark text-paper shadow-sm' : 'text-ink-soft hover:text-ink')}>
              <Box size={12} /> <span className="hidden sm:inline">3D</span>
            </button>
          </div>
          {!is3d && <>
            <button onClick={() => exportPng()} title="PNG"
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-paper border border-line text-xs font-semibold hover:bg-bg-warm hidden sm:flex">
              <FileImage size={12} /> PNG
            </button>
            <button onClick={() => exportPdf()} title="PDF"
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-paper border border-line text-xs font-semibold hover:bg-bg-warm hidden sm:flex">
              <Download size={12} /> PDF
            </button>
          </>}
          <button onClick={saveProject}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-paper border border-line text-xs font-semibold hover:bg-bg-warm">
            <Save size={12} /> <span className="hidden sm:inline">Сохранить</span>
          </button>
          <button onClick={() => { saveProject(); navigate('/orders/new') }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-deep text-paper text-xs font-bold hover:bg-amber-deep/90">
            <SendHorizonal size={12} /> <span className="hidden sm:inline">Заказать</span>
          </button>
        </div>
      </div>

      {/* ══ ДЕСКТОП: 3 колонки ══ */}
      <div className="hidden md:flex gap-3 flex-1 min-h-0 mt-2">
        <aside className="w-48 shrink-0"><LeftPanel /></aside>

        <div className="flex-1 flex flex-col bg-paper border border-line-soft rounded-2xl overflow-hidden min-w-0 shadow-soft">
          <div className="px-3 py-2 border-b border-line-soft bg-bg-warm/50 flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5 bg-paper border border-line rounded-lg p-0.5">
              <TBtn onClick={() => dispatch({ type: 'UNDO' })} disabled={state.past.length === 0} title="Ctrl+Z"><Undo2 size={13} /></TBtn>
              <TBtn onClick={() => dispatch({ type: 'REDO' })} disabled={state.future.length === 0} title="Ctrl+Y"><Redo2 size={13} /></TBtn>
            </div>
            {selectedEl && selectedEl.id !== 'body' && (
              <div className="flex gap-0.5 bg-paper border border-line rounded-lg p-0.5">
                <TBtn onClick={() => handleDuplicate(selectedEl.id)} title="Ctrl+D"><Copy size={13} /></TBtn>
                <TBtn onClick={() => { dispatch({ type: 'DELETE_ELEMENT', id: selectedEl.id }); showToast('Удалён') }} className="text-red-400 hover:!bg-red-50"><Trash2 size={13} /></TBtn>
              </div>
            )}
            <div className="flex items-center gap-1 flex-1 justify-center">
              {(['totalWidth','totalHeight','totalDepth'] as const).map((key, i) => (
                <span key={key} className="flex items-center gap-1">
                  {i > 0 && <span className="text-ink-muted/30 text-xs">×</span>}
                  <div className="flex items-center bg-paper border border-line rounded-md overflow-hidden">
                    <span className="text-[10px] font-bold text-ink-muted px-1.5 py-1 bg-bg-warm border-r border-line">{i===0?'Ш':i===1?'В':'Г'}</span>
                    <input type="number" value={state[key]}
                      onChange={(e) => dispatch({ type: 'SET_DIMENSION', key, value: parseInt(e.target.value)||0 })}
                      className="w-14 px-1.5 py-1 text-xs font-bold text-center focus:outline-none" />
                  </div>
                </span>
              ))}
              <span className="text-[10px] text-ink-muted ml-0.5">мм</span>
            </div>
            <TBtn onClick={() => { dispatch({ type: 'RESET' }); showToast('Сброшено') }}><RotateCcw size={13} /></TBtn>
          </div>
          {is3d ? (
            <Suspense fallback={<div className="flex-1 grid place-items-center"><div className="w-10 h-10 border-4 border-amber border-t-transparent rounded-full animate-spin"/></div>}>
              <Constructor3DScene state={state} />
            </Suspense>
          ) : (
            <ConstructorCanvas state={state} dispatch={dispatch} svgRef={svgRef} onDuplicate={handleDuplicate} />
          )}
        </div>

        <aside className="w-52 shrink-0 flex flex-col gap-3">
          <ElementsPanel />
          <SettingsPanel />
        </aside>
      </div>

      {/* ══ МОБАЙЛ: вкладки + полноэкранный канвас ══ */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 mt-2 gap-2">
        {/* Вкладки */}
        <div className="flex bg-bg-warm rounded-xl p-1 gap-1 shrink-0">
          {([
            { id: 'canvas' as const,    label: 'Чертёж',   icon: <PenLine size={14}/> },
            { id: 'templates' as const, label: 'Шаблоны',  icon: <Layers size={14}/> },
            { id: 'elements' as const,  label: 'Элементы', icon: <Plus size={14}/> },
            { id: 'settings' as const,  label: 'Параметры',icon: <Settings size={14}/> },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setMobileTab(tab.id)}
              className={cn('flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold transition-all',
                mobileTab === tab.id ? 'bg-paper shadow-sm text-ink' : 'text-ink-muted')}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Канвас */}
        {mobileTab === 'canvas' && (
          <div className="flex-1 flex flex-col bg-paper border border-line-soft rounded-2xl overflow-hidden">
            {/* Мини-тулбар */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-line-soft bg-bg-warm/50 shrink-0">
              <button onClick={() => dispatch({ type: 'TOGGLE_VIEW_MODE' })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-paper border border-line text-xs font-semibold">
                {is3d ? <><PenLine size={12}/> 2D</> : <><Box size={12}/> 3D</>}
              </button>
              <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.past.length===0}
                className="w-8 h-8 rounded-lg bg-paper border border-line grid place-items-center disabled:opacity-30">
                <Undo2 size={13}/>
              </button>
              <button onClick={() => dispatch({ type: 'REDO' })} disabled={state.future.length===0}
                className="w-8 h-8 rounded-lg bg-paper border border-line grid place-items-center disabled:opacity-30">
                <Redo2 size={13}/>
              </button>
              <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
                {(['totalWidth','totalHeight','totalDepth'] as const).map((key, i) => (
                  <span key={key} className="flex items-center gap-0.5 shrink-0">
                    {i > 0 && <span className="opacity-30 text-xs">×</span>}
                    <div className="flex items-center bg-paper border border-line rounded overflow-hidden">
                      <span className="text-[9px] font-bold text-ink-muted px-1 py-1 bg-bg-warm border-r border-line">
                        {i===0?'Ш':i===1?'В':'Г'}
                      </span>
                      <input type="number" value={state[key]}
                        onChange={(e) => {
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v > 0) dispatch({ type: 'SET_DIMENSION', key, value: v })
                        }}
                        className="w-11 px-1 py-1 text-[11px] font-bold text-center focus:outline-none"
                      />
                    </div>
                  </span>
                ))}
              </div>
              {selectedEl && selectedEl.id !== 'body' && (
                <button onClick={() => { dispatch({ type: 'DELETE_ELEMENT', id: selectedEl.id }); showToast('Удалён') }}
                  className="w-8 h-8 rounded-lg bg-paper border border-red-200 text-red-400 grid place-items-center">
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
            {is3d ? (
              <Suspense fallback={<div className="flex-1 grid place-items-center"><div className="w-10 h-10 border-4 border-amber border-t-transparent rounded-full animate-spin"/></div>}>
                <Constructor3DScene state={state} />
              </Suspense>
            ) : (
              <ConstructorCanvas state={state} dispatch={dispatch} svgRef={svgRef} onDuplicate={handleDuplicate} />
            )}
          </div>
        )}

        {/* Шаблоны */}
        {mobileTab === 'templates' && <div className="flex-1 overflow-y-auto"><LeftPanel /></div>}
        {/* Элементы */}
        {mobileTab === 'elements' && <div className="flex-1 overflow-y-auto"><ElementsPanel /></div>}
        {/* Параметры */}
        {mobileTab === 'settings' && <div className="flex-1 overflow-y-auto"><SettingsPanel /></div>}
      </div>
    </div>
  )
}

// ─── Компоненты ───
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper border border-line-soft rounded-xl p-3 shrink-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-muted mb-2">{title}</div>
      {children}
    </div>
  )
}
function TBtn({ children, onClick, disabled, title, className }: {
  children: React.ReactNode; onClick?: ()=>void; disabled?: boolean; title?: string; className?: string
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={cn('w-7 h-7 rounded-md grid place-items-center text-ink-soft transition-colors',
        disabled ? 'opacity-25 cursor-not-allowed' : 'hover:bg-bg-warm hover:text-ink', className)}>
      {children}
    </button>
  )
}
function PropRow({ label, value, onChange, min = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-line-soft/60 last:border-0">
      <span className="text-[11px] text-ink-muted">{label}</span>
      <input
        type="number"
        defaultValue={value}
        key={value}
        onBlur={(e) => {
          const v = parseInt(e.target.value)
          if (!isNaN(v) && v >= min) onChange(v)
          else e.target.value = String(value) // откат
        }}
        onChange={(e) => {
          const v = parseInt(e.target.value)
          if (!isNaN(v) && v >= min) onChange(v)
        }}
        className="w-16 bg-bg-warm border border-line rounded-md px-1.5 py-0.5 text-xs font-bold text-right focus:outline-none focus:border-amber-deep"
      />
    </div>
  )
}
function SwitchRow({ label, hint, icon, checked, onChange, onColor }: {
  label: string; hint: string; icon: React.ReactNode; checked: boolean; onChange: ()=>void; onColor: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line-soft/60 last:border-0 gap-2">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-soft font-medium">{icon} {label}</div>
        <div className="text-[10px] text-ink-muted mt-0.5">{hint}</div>
      </div>
      <button onClick={onChange} role="switch" aria-checked={checked}
        className={cn('relative inline-flex shrink-0 rounded-full transition-colors duration-200 h-5 w-9', checked ? onColor : 'bg-line')}>
        <span className={cn('pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-200 h-4 w-4 mt-0.5',
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
      </button>
    </div>
  )
}
function CostLine({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cn('flex justify-between items-center text-xs py-1', accent && 'text-amber-deep')}>
      <span className={accent ? 'text-amber-deep' : 'text-ink-muted'}>{label}</span>
      <span className="font-semibold">~{formatShortPrice(value)} с</span>
    </div>
  )
}
