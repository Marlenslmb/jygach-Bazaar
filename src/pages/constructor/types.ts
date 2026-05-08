// ===== Element types =====
export type ElementType =
  | 'body'
  | 'shelf'
  | 'drawer'
  | 'door'
  | 'rod'
  | 'mirror'
  | 'divider'

export interface CanvasElement {
  id: string
  type: ElementType
  x: number   // мм
  y: number   // мм
  w: number   // мм
  h: number   // мм
  label?: string
}

export type MaterialId = 'oak' | 'walnut' | 'white' | 'black' | 'ash' | 'pine'

export interface Material {
  id: MaterialId
  label: string
  fill: string
  stroke: string
  dark: string   // для 2.5D граней
}

export const MATERIALS: Record<MaterialId, Material> = {
  oak:    { id: 'oak',    label: 'Дуб',       fill: '#d4a96a', stroke: '#a07840', dark: '#8a5c28' },
  walnut: { id: 'walnut', label: 'Орех',      fill: '#7a4e32', stroke: '#4a2e18', dark: '#2e1a08' },
  white:  { id: 'white',  label: 'Белый МДФ', fill: '#f4f0e8', stroke: '#c8c0b0', dark: '#a8a098' },
  black:  { id: 'black',  label: 'Чёрный',    fill: '#32302c', stroke: '#18161a', dark: '#08060a' },
  ash:    { id: 'ash',    label: 'Ясень',      fill: '#c8b090', stroke: '#9a8060', dark: '#6a5030' },
  pine:   { id: 'pine',   label: 'Сосна',      fill: '#e8c870', stroke: '#b89040', dark: '#886020' },
}

// ===== State =====
export interface ConstructorState {
  totalWidth: number
  totalHeight: number
  totalDepth: number
  material: MaterialId
  boardThickness: number
  hasLighting: boolean
  hasBackPanel: boolean
  viewMode: '2d' | 'iso'   // 2D чертёж или изометрия
  elements: CanvasElement[]
  selectedId: string | null
  past: CanvasElement[][]
  future: CanvasElement[][]
}

// ===== Actions =====
// Ключевое разделение:
// MOVE_ELEMENT_SILENT / RESIZE_ELEMENT_SILENT — во время drag, БЕЗ записи в историю
// COMMIT_DRAG — при mouseup, пишет в историю
// MOVE_ELEMENT / RESIZE_ELEMENT — из полей ввода, С историей (один шаг)
export type ConstructorAction =
  | { type: 'ADD_ELEMENT';            element: Omit<CanvasElement, 'id'> }
  | { type: 'DUPLICATE_ELEMENT';      id: string }
  | { type: 'MOVE_ELEMENT';           id: string; x: number; y: number }
  | { type: 'RESIZE_ELEMENT';         id: string; w: number; h: number; x?: number; y?: number }
  | { type: 'MOVE_ELEMENT_SILENT';    id: string; x: number; y: number }
  | { type: 'RESIZE_ELEMENT_SILENT';  id: string; w: number; h: number; x?: number; y?: number }
  | { type: 'COMMIT_DRAG';            snapshot: CanvasElement[] }  // пишет snapshot в past
  | { type: 'DELETE_ELEMENT';         id: string }
  | { type: 'BRING_TO_FRONT';         id: string }
  | { type: 'SEND_TO_BACK';           id: string }
  | { type: 'SELECT';                 id: string | null }
  | { type: 'SET_MATERIAL';           material: MaterialId }
  | { type: 'SET_DIMENSION';          key: 'totalWidth' | 'totalHeight' | 'totalDepth'; value: number }
  | { type: 'SET_BOARD_THICKNESS';    value: number }
  | { type: 'TOGGLE_LIGHTING' }
  | { type: 'TOGGLE_BACK_PANEL' }
  | { type: 'TOGGLE_VIEW_MODE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_PRESET'; preset: 'wardrobe' | 'kitchen' | 'shelf' | 'table' | 'bed' | 'desk' | 'vanity' | 'chair' }
  | { type: 'RESET' }

// ===== Presets =====
// Шкаф-купе
function wardrobePreset(): CanvasElement[] {
  return [
    { id: 'body',     type: 'body',    x: 0,    y: 0,    w: 2200, h: 2400, label: 'Шкаф-купе' },
    { id: 'div-1',   type: 'divider', x: 1100, y: 0,    w: 18,   h: 2400, label: '' },
    { id: 'shelf-1', type: 'shelf',   x: 0,    y: 600,  w: 1100, h: 18,   label: 'Полка' },
    { id: 'shelf-2', type: 'shelf',   x: 0,    y: 1200, w: 1100, h: 18,   label: 'Полка' },
    { id: 'shelf-3', type: 'shelf',   x: 0,    y: 1800, w: 1100, h: 18,   label: 'Полка' },
    { id: 'rod-1',   type: 'rod',     x: 1118, y: 400,  w: 1082, h: 30,   label: 'Штанга' },
    { id: 'drw-1',   type: 'drawer',  x: 1118, y: 1900, w: 1082, h: 160,  label: 'Ящик' },
    { id: 'drw-2',   type: 'drawer',  x: 1118, y: 2080, w: 1082, h: 160,  label: 'Ящик' },
  ]
}
// Стеллаж
function shelfPreset(): CanvasElement[] {
  return [
    { id: 'body',     type: 'body',  x: 0, y: 0,    w: 1200, h: 2000, label: 'Стеллаж' },
    { id: 'shelf-1', type: 'shelf', x: 0, y: 400,  w: 1200, h: 18,   label: 'Полка' },
    { id: 'shelf-2', type: 'shelf', x: 0, y: 800,  w: 1200, h: 18,   label: 'Полка' },
    { id: 'shelf-3', type: 'shelf', x: 0, y: 1200, w: 1200, h: 18,   label: 'Полка' },
    { id: 'shelf-4', type: 'shelf', x: 0, y: 1600, w: 1200, h: 18,   label: 'Полка' },
  ]
}
// Кухня
function kitchenPreset(): CanvasElement[] {
  return [
    { id: 'body',     type: 'body',    x: 0,    y: 0,    w: 3000, h: 2200, label: 'Кухня' },
    { id: 'div-1',   type: 'divider', x: 600,  y: 700,  w: 18,   h: 1500, label: '' },
    { id: 'div-2',   type: 'divider', x: 1200, y: 700,  w: 18,   h: 1500, label: '' },
    { id: 'div-3',   type: 'divider', x: 1800, y: 700,  w: 18,   h: 1500, label: '' },
    { id: 'div-4',   type: 'divider', x: 2400, y: 700,  w: 18,   h: 1500, label: '' },
    { id: 'drw-1',   type: 'drawer',  x: 0,    y: 1900, w: 600,  h: 160,  label: 'Ящик' },
    { id: 'drw-2',   type: 'drawer',  x: 0,    y: 2060, w: 600,  h: 140,  label: 'Ящик' },
    { id: 'top',     type: 'shelf',   x: 0,    y: 700,  w: 3000, h: 40,   label: 'Столешница' },
    { id: 'shelf-1', type: 'shelf',   x: 0,    y: 320,  w: 3000, h: 18,   label: 'Полка' },
  ]
}
// Стол — вид спереди: столешница сверху, ножки по бокам как divider
function tablePreset(): CanvasElement[] {
  return [
    { id: 'body',    type: 'body',    x: 0,    y: 0,   w: 1600, h: 760, label: 'Стол' },
    { id: 'top',     type: 'shelf',   x: 0,    y: 0,   w: 1600, h: 40,  label: 'Столешница' },
    { id: 'leg-1',   type: 'divider', x: 0,    y: 40,  w: 60,   h: 720, label: 'Ножка' },
    { id: 'leg-2',   type: 'divider', x: 1540, y: 40,  w: 60,   h: 720, label: 'Ножка' },
    { id: 'shelf-1', type: 'shelf',   x: 60,   y: 400, w: 1480, h: 18,  label: 'Полка' },
  ]
}
// Компьютерный стол (с тумбой)
function deskPreset(): CanvasElement[] {
  return [
    { id: 'body',    type: 'body',    x: 0,    y: 0,   w: 1400, h: 760, label: 'Компьютерный стол' },
    { id: 'top',     type: 'shelf',   x: 0,    y: 0,   w: 1400, h: 36,  label: 'Столешница' },
    { id: 'leg-1',   type: 'divider', x: 0,    y: 36,  w: 60,   h: 724, label: 'Ножка' },
    { id: 'cab',     type: 'divider', x: 1100, y: 36,  w: 300,  h: 724, label: 'Тумба' },
    { id: 'drw-1',   type: 'drawer',  x: 1100, y: 200, w: 300,  h: 160, label: 'Ящик' },
    { id: 'drw-2',   type: 'drawer',  x: 1100, y: 380, w: 300,  h: 160, label: 'Ящик' },
    { id: 'drw-3',   type: 'drawer',  x: 1100, y: 560, w: 300,  h: 160, label: 'Ящик' },
  ]
}
// Кровать — вид спереди (как смотришь на кровать стоя)
function bedPreset(): CanvasElement[] {
  return [
    { id: 'body',  type: 'body',    x: 0,   y: 0,    w: 1800, h: 700, label: 'Кровать' },
    { id: 'head',  type: 'divider', x: 0,   y: 0,    w: 18,   h: 700, label: '' },
    { id: 'foot',  type: 'divider', x: 1782,y: 0,    w: 18,   h: 700, label: '' },
    { id: 'top',   type: 'shelf',   x: 0,   y: 0,    w: 1800, h: 18,  label: 'Изголовье' },
    { id: 'drw-1', type: 'drawer',  x: 18,  y: 500,  w: 580,  h: 160, label: 'Ящик' },
    { id: 'drw-2', type: 'drawer',  x: 615, y: 500,  w: 580,  h: 160, label: 'Ящик' },
    { id: 'drw-3', type: 'drawer',  x: 1212,y: 500,  w: 570,  h: 160, label: 'Ящик' },
  ]
}
// Тумба под раковину
function vanityPreset(): CanvasElement[] {
  return [
    { id: 'body',    type: 'body',    x: 0,   y: 0,   w: 800,  h: 850, label: 'Тумба под раковину' },
    { id: 'top',     type: 'shelf',   x: 0,   y: 0,   w: 800,  h: 30,  label: 'Столешница' },
    { id: 'div-1',   type: 'divider', x: 390, y: 30,  w: 18,   h: 680, label: '' },
    { id: 'door-l',  type: 'door',    x: 0,   y: 30,  w: 390,  h: 680, label: 'Дверца' },
    { id: 'door-r',  type: 'door',    x: 408, y: 30,  w: 392,  h: 680, label: 'Дверца' },
    { id: 'plinth',  type: 'shelf',   x: 0,   y: 800, w: 800,  h: 50,  label: 'Плинтус' },
  ]
}
// Стул — вид спереди
function chairPreset(): CanvasElement[] {
  return [
    { id: 'body',    type: 'body',    x: 0,   y: 0,   w: 460,  h: 900, label: 'Стул' },
    { id: 'back',    type: 'shelf',   x: 0,   y: 0,   w: 460,  h: 30,  label: 'Спинка' },
    { id: 'seat',    type: 'shelf',   x: 0,   y: 450, w: 460,  h: 36,  label: 'Сиденье' },
    { id: 'leg-fl',  type: 'divider', x: 0,   y: 486, w: 36,   h: 414, label: 'Ножка' },
    { id: 'leg-fr',  type: 'divider', x: 424, y: 486, w: 36,   h: 414, label: 'Ножка' },
  ]
}

export const INITIAL_STATE: ConstructorState = {
  totalWidth: 2200, totalHeight: 2400, totalDepth: 600,
  material: 'oak', boardThickness: 18,
  hasLighting: false, hasBackPanel: true, viewMode: '2d',
  elements: wardrobePreset(),
  selectedId: null, past: [], future: [],
}

// ===== Helpers =====
let _idCounter = 0
function makeId() { return `el-${Date.now()}-${++_idCounter}` }

function pushHistory(state: ConstructorState, snapshot: CanvasElement[]): Pick<ConstructorState, 'past' | 'future'> {
  return { past: [...state.past.slice(-29), snapshot], future: [] }
}

function applyMove(elements: CanvasElement[], id: string, x: number, y: number) {
  return elements.map((el) => el.id === id ? { ...el, x: Math.max(0, x), y: Math.max(0, y) } : el)
}

function applyResize(elements: CanvasElement[], id: string, w: number, h: number, x?: number, y?: number) {
  return elements.map((el) => el.id === id ? {
    ...el,
    w: Math.max(30, w), h: Math.max(10, h),
    ...(x !== undefined ? { x: Math.max(0, x) } : {}),
    ...(y !== undefined ? { y: Math.max(0, y) } : {}),
  } : el)
}

// ===== Reducer =====
export function constructorReducer(state: ConstructorState, action: ConstructorAction): ConstructorState {
  switch (action.type) {

    case 'ADD_ELEMENT': {
      const el = { ...action.element, id: makeId() }
      return { ...state, ...pushHistory(state, state.elements), elements: [...state.elements, el], selectedId: el.id }
    }

    case 'DUPLICATE_ELEMENT': {
      const src = state.elements.find((e) => e.id === action.id)
      if (!src) return state
      const dup = { ...src, id: makeId(), x: src.x + 30, y: src.y + 30 }
      return { ...state, ...pushHistory(state, state.elements), elements: [...state.elements, dup], selectedId: dup.id }
    }

    // Из полей ввода — записываем в историю
    case 'MOVE_ELEMENT': {
      if (action.id === 'body') return state
      return { ...state, ...pushHistory(state, state.elements), elements: applyMove(state.elements, action.id, action.x, action.y) }
    }
    case 'RESIZE_ELEMENT': {
      return { ...state, ...pushHistory(state, state.elements), elements: applyResize(state.elements, action.id, action.w, action.h, action.x, action.y) }
    }

    // Во время drag — БЕЗ истории (быстро, не засоряет стек)
    case 'MOVE_ELEMENT_SILENT': {
      if (action.id === 'body') return state
      return { ...state, elements: applyMove(state.elements, action.id, action.x, action.y) }
    }
    case 'RESIZE_ELEMENT_SILENT': {
      return { ...state, elements: applyResize(state.elements, action.id, action.w, action.h, action.x, action.y) }
    }

    // При mouseup — пишем snapshot в историю (то что было ДО drag)
    case 'COMMIT_DRAG': {
      return { ...state, ...pushHistory(state, action.snapshot) }
    }

    case 'DELETE_ELEMENT': {
      if (action.id === 'body') return state
      return {
        ...state, ...pushHistory(state, state.elements),
        elements: state.elements.filter((e) => e.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }
    }

    case 'BRING_TO_FRONT': {
      const el = state.elements.find((e) => e.id === action.id)
      if (!el) return state
      return { ...state, ...pushHistory(state, state.elements), elements: [...state.elements.filter((e) => e.id !== action.id), el] }
    }

    case 'SEND_TO_BACK': {
      const el = state.elements.find((e) => e.id === action.id)
      if (!el || action.id === 'body') return state
      const body = state.elements.find((e) => e.id === 'body')!
      const rest = state.elements.filter((e) => e.id !== action.id && e.id !== 'body')
      return { ...state, ...pushHistory(state, state.elements), elements: [body, el, ...rest] }
    }

    case 'SELECT': return { ...state, selectedId: action.id }
    case 'SET_MATERIAL': return { ...state, material: action.material }
    case 'SET_BOARD_THICKNESS': return { ...state, boardThickness: action.value }
    case 'TOGGLE_LIGHTING': return { ...state, hasLighting: !state.hasLighting }
    case 'TOGGLE_BACK_PANEL': return { ...state, hasBackPanel: !state.hasBackPanel }
    case 'TOGGLE_VIEW_MODE': return { ...state, viewMode: state.viewMode === '2d' ? 'iso' : '2d', selectedId: null }

    case 'SET_DIMENSION': {
      const next = { ...state, [action.key]: action.value }
      if (action.key === 'totalWidth' || action.key === 'totalHeight') {
        next.elements = state.elements.map((el) =>
          el.id === 'body' ? { ...el, w: next.totalWidth, h: next.totalHeight } : el
        )
      }
      return next
    }

    case 'UNDO': {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return { ...state, past: state.past.slice(0, -1), future: [state.elements, ...state.future], elements: prev, selectedId: null }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return { ...state, past: [...state.past, state.elements], future: state.future.slice(1), elements: next }
    }

    case 'LOAD_PRESET': {
      const map = { wardrobe: wardrobePreset, kitchen: kitchenPreset, shelf: shelfPreset, table: tablePreset, bed: bedPreset, desk: deskPreset, vanity: vanityPreset, chair: chairPreset }
      const elements = map[action.preset]()
      const body = elements.find((e) => e.id === 'body')
      return { ...state, ...pushHistory(state, state.elements), elements, selectedId: null, totalWidth: body?.w ?? state.totalWidth, totalHeight: body?.h ?? state.totalHeight }
    }
    case 'RESET': return { ...INITIAL_STATE }
    default: return state
  }
}
