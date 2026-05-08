import { useRef, useState, useCallback, useEffect } from 'react'
import type { ConstructorState, ConstructorAction, CanvasElement } from './types'
import { MATERIALS } from './types'

const GRID_MM = 10  // привязка к сетке в мм

interface DragState {
  type: 'move' | 'resize-br' | 'resize-bl' | 'resize-tr' | 'resize-tl'
  id: string
  startX: number; startY: number
  origX: number; origY: number
  origW: number; origH: number
  snapshot: CanvasElement[]   // состояние ДО начала drag — пишем в историю при mouseup
}

interface CtxMenu { x: number; y: number; elementId: string }

interface Props {
  state: ConstructorState
  dispatch: React.Dispatch<ConstructorAction>
  svgRef: React.RefObject<SVGSVGElement>
  onDuplicate: (id: string) => void
}

function snap(v: number, grid = GRID_MM) { return Math.round(v / grid) * grid }

function getColors(type: CanvasElement['type'], fill: string, stroke: string) {
  if (type === 'body')    return { fill, stroke, sw: 2.5, alpha: 0.15 }
  if (type === 'rod')     return { fill: '#909090', stroke: '#606060', sw: 1.5, alpha: 1 }
  if (type === 'mirror')  return { fill: '#c0dce8', stroke: '#80b0c0', sw: 2, alpha: 0.65 }
  if (type === 'door')    return { fill, stroke, sw: 2, alpha: 0.5 }
  return { fill, stroke, sw: 1.5, alpha: 0.92 }
}

// ——— Изометрическая проекция ———
// Преобразование 3D (mm) → SVG px
function iso(x: number, y: number, z: number, scale: number, ox: number, oy: number) {
  return {
    sx: ox + (x - z) * scale * Math.cos(Math.PI / 6),
    sy: oy + (x + z) * scale * Math.sin(Math.PI / 6) - y * scale,
  }
}

function isoFace(
  points: [number, number, number][],
  scale: number, ox: number, oy: number,
  fill: string, stroke: string, alpha: number, sw: number
): string {
  const pts = points.map(([x, y, z]) => {
    const { sx, sy } = iso(x, y, z, scale, ox, oy)
    return `${sx},${sy}`
  })
  return `<polygon points="${pts.join(' ')}" fill="${fill}" fill-opacity="${alpha}" stroke="${stroke}" stroke-width="${sw}"/>`
}

export function ConstructorCanvas({ state, dispatch, svgRef, onDuplicate }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null)
  const [svgSize, setSvgSize] = useState({ w: 800, h: 560 })

  const mat = MATERIALS[state.material]
  const is3d = state.viewMode === 'iso'

  // Подгоняем SVG под контейнер
  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    const ro = new ResizeObserver(() => setSvgSize({ w: el.clientWidth || 800, h: el.clientHeight || 560 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Хоткеи
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput && state.selectedId && state.selectedId !== 'body') {
        dispatch({ type: 'DELETE_ELEMENT', id: state.selectedId })
      }
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }) }
      if (((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey)) || ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); dispatch({ type: 'REDO' }) }
      if (e.key === 'Escape') { dispatch({ type: 'SELECT', id: null }); setCtxMenu(null) }
      if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey) && !inInput && state.selectedId && state.selectedId !== 'body') {
        e.preventDefault(); onDuplicate(state.selectedId)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [state.selectedId, dispatch, onDuplicate])

  useEffect(() => {
    if (!ctxMenu) return
    const h = () => setCtxMenu(null)
    window.addEventListener('click', h, { once: true })
  }, [ctxMenu])

  // ——— Масштаб и позиция для 2D ———
  const { w: svgW, h: svgH } = svgSize
  const PAD = 54
  const scaleX = (svgW - PAD * 2 - 24) / state.totalWidth
  const scaleY = (svgH - PAD * 2 - 20) / state.totalHeight
  const scale2d = Math.min(scaleX, scaleY, 0.30)
  const ox2d = PAD + (svgW - PAD * 2 - 24 - state.totalWidth * scale2d) / 2
  const oy2d = PAD

  const toMm = (px: number) => snap(px / scale2d)

  // ——— Drag ———
  const startDrag = useCallback((e: React.MouseEvent, el: CanvasElement, corner?: 'br'|'bl'|'tr'|'tl') => {
    e.preventDefault(); e.stopPropagation()
    dispatch({ type: 'SELECT', id: el.id })
    setCtxMenu(null)
    setDrag({
      type: corner ? `resize-${corner}` as DragState['type'] : 'move',
      id: el.id,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y,
      origW: el.w, origH: el.h,
      snapshot: state.elements.map((e) => ({ ...e })),  // deep copy ДО начала drag
    })
  }, [dispatch, state.elements])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return
    const dx = toMm(e.clientX - drag.startX)
    const dy = toMm(e.clientY - drag.startY)

    if (drag.type === 'move') {
      dispatch({ type: 'MOVE_ELEMENT_SILENT', id: drag.id, x: drag.origX + dx, y: drag.origY + dy })
    } else if (drag.type === 'resize-br') {
      dispatch({ type: 'RESIZE_ELEMENT_SILENT', id: drag.id, w: drag.origW + dx, h: drag.origH + dy })
    } else if (drag.type === 'resize-bl') {
      dispatch({ type: 'RESIZE_ELEMENT_SILENT', id: drag.id, x: drag.origX + dx, w: drag.origW - dx, h: drag.origH + dy })
    } else if (drag.type === 'resize-tr') {
      dispatch({ type: 'RESIZE_ELEMENT_SILENT', id: drag.id, y: drag.origY + dy, w: drag.origW + dx, h: drag.origH - dy })
    } else if (drag.type === 'resize-tl') {
      dispatch({ type: 'RESIZE_ELEMENT_SILENT', id: drag.id, x: drag.origX + dx, y: drag.origY + dy, w: drag.origW - dx, h: drag.origH - dy })
    }
  }, [drag, dispatch, toMm])

  const onMouseUp = useCallback(() => {
    if (drag) {
      // Пишем snapshot (состояние ДО drag) в историю — один раз
      dispatch({ type: 'COMMIT_DRAG', snapshot: drag.snapshot })
      setDrag(null)
    }
  }, [drag, dispatch])

  const onCtxMenu = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    e.preventDefault(); e.stopPropagation()
    dispatch({ type: 'SELECT', id: el.id })
    setCtxMenu({ x: e.clientX, y: e.clientY, elementId: el.id })
  }, [dispatch])

  const selectedEl = state.elements.find((e) => e.id === state.selectedId)

  // ——— ИЗОМЕТРИЧЕСКИЙ ВИД ———
  if (is3d) {
    const isoScale = Math.min(
      (svgW - 80) / (state.totalWidth + state.totalDepth) / Math.cos(Math.PI / 6),
      (svgH - 60) / (state.totalHeight + (state.totalWidth + state.totalDepth) * Math.sin(Math.PI / 6)),
      0.09
    )
    const ioxBase = svgW / 2
    const ioyBase = svgH * 0.72

    const D = state.totalDepth    // глубина
    const W = state.totalWidth
    const H = state.totalHeight

    return (
      <div ref={wrapRef} className="flex-1 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #f0e8d8 0%, #e8dcc8 100%)' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="iso-shadow">
              <feDropShadow dx="4" dy="8" stdDeviation="8" floodColor="rgba(28,22,18,0.18)" />
            </filter>
          </defs>

          {/* Тень на полу */}
          <ellipse
            cx={ioxBase} cy={ioyBase + 12}
            rx={state.totalWidth * isoScale * 0.7} ry={state.totalDepth * isoScale * 0.25}
            fill="rgba(28,22,18,0.10)"
          />

          {/* Основной корпус — 3 грани */}
          {(() => {
            const body = state.elements.find((e) => e.id === 'body')
            if (!body) return null
            const { fill, stroke } = mat

            // Передняя грань (x: 0→W, y: H→0, z: 0)
            const front = (['tl','tr','br','bl'] as const).map((c) => {
              const [bx, by, bz] = c === 'tl' ? [0,H,0] : c === 'tr' ? [W,H,0] : c === 'br' ? [W,0,0] : [0,0,0]
              const { sx, sy } = iso(bx, by, bz, isoScale, ioxBase, ioyBase)
              return `${sx},${sy}`
            })
            // Верхняя грань (y=H, z: 0→D)
            const top = (['fl','fr','br','bl'] as const).map((c) => {
              const [bx, by, bz] = c === 'fl' ? [0,H,0] : c === 'fr' ? [W,H,0] : c === 'br' ? [W,H,D] : [0,H,D]
              const { sx, sy } = iso(bx, by, bz, isoScale, ioxBase, ioyBase)
              return `${sx},${sy}`
            })
            // Боковая грань (x=W, z: 0→D)
            const side = (['tl','tr','br','bl'] as const).map((c) => {
              const [bx, by, bz] = c === 'tl' ? [W,H,0] : c === 'tr' ? [W,H,D] : c === 'br' ? [W,0,D] : [W,0,0]
              const { sx, sy } = iso(bx, by, bz, isoScale, ioxBase, ioyBase)
              return `${sx},${sy}`
            })

            return (
              <g filter="url(#iso-shadow)">
                <polygon points={front.join(' ')} fill={fill} fillOpacity={0.92} stroke={stroke} strokeWidth={1.5} />
                <polygon points={top.join(' ')} fill={mat.dark} fillOpacity={0.4} stroke={stroke} strokeWidth={1} />
                <polygon points={side.join(' ')} fill={mat.dark} fillOpacity={0.65} stroke={stroke} strokeWidth={1} />
              </g>
            )
          })()}

          {/* Элементы на передней грани */}
          {state.elements.filter((e) => e.id !== 'body').map((el) => {
            if (el.type === 'rod') {
              const { sx: x1, sy: y1 } = iso(el.x, H - el.y, 0, isoScale, ioxBase, ioyBase)
              const { sx: x2, sy: y2 } = iso(el.x + el.w, H - el.y, 0, isoScale, ioxBase, ioyBase)
              return (
                <g key={el.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#808080" strokeWidth={3} strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c0c0c0" strokeWidth={1.5} strokeLinecap="round" />
                </g>
              )
            }
            if (el.type === 'divider') {
              const pts = [
                [el.x, H - el.y, 0], [el.x, H - el.y - el.h, 0],
                [el.x, H - el.y - el.h, D * 0.15], [el.x, H - el.y, D * 0.15]
              ] as [number,number,number][]
              const svgPts = pts.map(([x, y, z]) => {
                const { sx, sy } = iso(x, y, z, isoScale, ioxBase, ioyBase)
                return `${sx},${sy}`
              })
              return <polygon key={el.id} points={svgPts.join(' ')} fill={mat.fill} fillOpacity={0.8} stroke={mat.stroke} strokeWidth={1} />
            }

            // Полки, ящики, двери, зеркала
            const y0 = H - el.y - el.h
            const y1 = H - el.y
            const { sx: lx0, sy: ly0 } = iso(el.x, y0, 0, isoScale, ioxBase, ioyBase)
            const { sx: rx0, sy: ry0 } = iso(el.x + el.w, y0, 0, isoScale, ioxBase, ioyBase)
            const { sx: rx1, sy: ry1 } = iso(el.x + el.w, y1, 0, isoScale, ioxBase, ioyBase)
            const { sx: lx1, sy: ly1 } = iso(el.x, y1, 0, isoScale, ioxBase, ioyBase)

            let fill = mat.fill; let alpha = 0.88; let stroke = mat.stroke
            if (el.type === 'mirror') { fill = '#b8d8e8'; alpha = 0.7; stroke = '#80b0c0' }
            if (el.type === 'door')   { fill = mat.fill; alpha = 0.5 }

            const mx = (lx0 + rx1) / 2; const my = (ly0 + ry1) / 2

            return (
              <g key={el.id}>
                <polygon
                  points={`${lx0},${ly0} ${rx0},${ry0} ${rx1},${ry1} ${lx1},${ly1}`}
                  fill={fill} fillOpacity={alpha} stroke={stroke} strokeWidth={1.2}
                />
                {/* Ящик — ручка */}
                {el.type === 'drawer' && (
                  <>
                    <line x1={lx0 + (rx0-lx0)*0.1} y1={ly0 + (ry0-ly0)*0.1 + (ly1-ly0)*0.35}
                      x2={lx0 + (rx0-lx0)*0.9} y2={ly0 + (ry0-ly0)*0.9 + (ly1-ly0)*0.35}
                      stroke={mat.stroke} strokeWidth={0.6} strokeOpacity={0.4} />
                    <circle cx={mx} cy={(ly0+ry0)/2 + (ly1-ly0+ry1-ry0)*0.2} r={3}
                      fill="#a08060" stroke="#806040" strokeWidth={0.8} />
                  </>
                )}
                {/* LED подсветка под полкой */}
                {state.hasLighting && el.type === 'shelf' && (
                  <line x1={lx1} y1={ly1 + 2} x2={rx1} y2={ry1 + 2}
                    stroke="#ffd060" strokeWidth={2} strokeOpacity={0.8} />
                )}
                {/* Зеркало — блик */}
                {el.type === 'mirror' && (
                  <ellipse cx={mx - (rx0-lx0)*0.1} cy={(ly0+ry0)/2 + (ly1-ly0+ry1-ry0)*0.2}
                    rx={(rx0-lx0)*0.08} ry={(ly1-ly0)*0.1}
                    fill="white" fillOpacity={0.4} />
                )}
              </g>
            )
          })}

          {/* Подпись */}
          <text x={svgW/2} y={svgH - 12} textAnchor="middle" fontSize={10} fill="#6b5d4f" fontWeight="500">
            {state.totalWidth} × {state.totalDepth} × {state.totalHeight} мм · {mat.label}
          </text>
        </svg>

        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-paper/90 backdrop-blur border border-line-soft px-4 py-1.5 rounded-full text-xs text-ink-muted pointer-events-none">
          Изометрический вид — только просмотр
        </div>
      </div>
    )
  }

  // ——— 2D ВИД ———
  return (
    <div ref={wrapRef}
      className="flex-1 relative overflow-hidden select-none"
      style={{
        backgroundImage: 'linear-gradient(rgba(107,93,79,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(107,93,79,0.055) 1px,transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: drag?.type === 'move' ? 'grabbing' : 'default',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={() => { dispatch({ type: 'SELECT', id: null }); setCtxMenu(null) }}
    >
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: 'Manrope,sans-serif' }}>
        <defs>
          <filter id="el-shadow"><feDropShadow dx="1" dy="2" stdDeviation="3" floodOpacity="0.08" /></filter>
          <filter id="led-glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="sel-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <pattern id="inner-grid" x={ox2d} y={oy2d} width={GRID_MM * scale2d} height={GRID_MM * scale2d} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_MM*scale2d} 0 L 0 0 0 ${GRID_MM*scale2d}`} fill="none" stroke="rgba(107,93,79,0.07)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Фон чертежа */}
        <rect x={ox2d-10} y={oy2d-10} width={state.totalWidth*scale2d+20} height={state.totalHeight*scale2d+20} fill="#faf6ec" rx="6" filter="url(#el-shadow)" />
        {/* Внутренняя сетка */}
        <rect x={ox2d} y={oy2d} width={state.totalWidth*scale2d} height={state.totalHeight*scale2d} fill="url(#inner-grid)" />

        {/* Размерные линии */}
        <DimLine x1={ox2d} y1={oy2d-22} x2={ox2d+state.totalWidth*scale2d} y2={oy2d-22} label={`${state.totalWidth} мм`} />
        <DimLine x1={ox2d+state.totalWidth*scale2d+22} y1={oy2d} x2={ox2d+state.totalWidth*scale2d+22} y2={oy2d+state.totalHeight*scale2d} label={`${state.totalHeight} мм`} vertical />

        {/* Элементы */}
        {state.elements.map((el) => {
          const x = ox2d + el.x * scale2d
          const y = oy2d + el.y * scale2d
          const w = el.w * scale2d
          const h = Math.max(el.h * scale2d, 1.5)
          const col = getColors(el.type, mat.fill, mat.stroke)
          const isSel = el.id === state.selectedId
          const draggable = el.id !== 'body'

          return (
            <g key={el.id}>
              {isSel && el.id !== 'body' && (
                <rect x={x} y={y} width={w} height={h} rx={2} fill="none"
                  stroke="#c8651b" strokeWidth={6} strokeOpacity={0.15} filter="url(#sel-glow)" />
              )}
              <rect
                x={x} y={y} width={w} height={h}
                rx={el.type === 'rod' ? Math.min(h/2, 7) : 2}
                fill={col.fill} fillOpacity={col.alpha}
                stroke={isSel ? '#c8651b' : col.stroke}
                strokeWidth={isSel ? 2 : col.sw}
                strokeDasharray={el.type === 'door' ? '5 3' : undefined}
                cursor={draggable ? 'grab' : 'default'}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => draggable && startDrag(e, el)}
                onContextMenu={(e) => onCtxMenu(e, el)}
              />

              {/* Текстура волокна */}
              {['shelf','drawer','divider'].includes(el.type) && w > 8 && (
                <g pointerEvents="none">
                  {Array.from({ length: Math.ceil(w / 8) }).map((_, i) => (
                    <line key={i} x1={x+i*8+4} y1={y+2} x2={x+i*8+4} y2={y+h-2}
                      stroke={mat.stroke} strokeWidth={0.35} strokeOpacity={0.18} />
                  ))}
                </g>
              )}

              {/* Ящик — линия + ручка */}
              {el.type === 'drawer' && w > 30 && h > 12 && (
                <>
                  <line x1={x} y1={y+h*0.38} x2={x+w} y2={y+h*0.38} stroke={mat.stroke} strokeWidth={0.7} strokeOpacity={0.35} />
                  <rect x={x+w/2-Math.min(w*0.22,32)} y={y+h*0.52-4} width={Math.min(w*0.44,64)} height={8} rx={4}
                    fill="#a08060" stroke="#806040" strokeWidth={0.8} pointerEvents="none" />
                </>
              )}

              {/* Дверца — ручка */}
              {el.type === 'door' && h > 50 && (
                <rect x={x+w-10} y={y+h*0.38} width={6} height={h*0.22} rx={3}
                  fill="#a08060" stroke="#806040" strokeWidth={0.8} pointerEvents="none" />
              )}

              {/* Зеркало — блик */}
              {el.type === 'mirror' && (
                <ellipse cx={x+w*0.3} cy={y+h*0.25} rx={w*0.07} ry={h*0.07}
                  fill="white" fillOpacity={0.45} pointerEvents="none" />
              )}

              {/* LED */}
              {state.hasLighting && el.type === 'shelf' && w > 16 && (
                <line x1={x+4} y1={y+1.5} x2={x+w-4} y2={y+1.5}
                  stroke="#ffd060" strokeWidth={2.5} strokeOpacity={0.9}
                  filter="url(#led-glow)" pointerEvents="none" />
              )}

              {/* Размеры выбранного */}
              {isSel && el.id !== 'body' && (
                <>
                  <rect x={x+w/2-24} y={y-18} width={48} height={14} rx={3} fill="#c8651b" />
                  <text x={x+w/2} y={y-8} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">{el.w} мм</text>
                  {h > 18 && <>
                    <rect x={x+w+4} y={y+h/2-8} width={32} height={14} rx={3} fill="#c8651b" />
                    <text x={x+w+20} y={y+h/2+4} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">{el.h}</text>
                  </>}
                </>
              )}

              {/* Метка */}
              {el.label && el.id !== 'body' && w > 24 && h > 12 && (
                <text x={x+w/2} y={y+h/2+3} textAnchor="middle"
                  fontSize={Math.min(9, h*0.38)} fill={el.type==='rod' ? '#fff' : mat.stroke}
                  fillOpacity={0.5} fontWeight="600" pointerEvents="none">
                  {el.label}
                </text>
              )}

              {/* Resize handles — 4 угла */}
              {isSel && el.id !== 'body' && (
                (['br','bl','tr','tl'] as const).map((c) => {
                  const hx = c.includes('r') ? x+w : x
                  const hy = c.includes('b') ? y+h : y
                  const cur = { br:'se-resize', bl:'sw-resize', tr:'ne-resize', tl:'nw-resize' }[c]
                  return (
                    <rect key={c} x={hx-6} y={hy-6} width={12} height={12} rx={2.5}
                      fill="#c8651b" stroke="white" strokeWidth={1.5}
                      cursor={cur}
                      onMouseDown={(e) => startDrag(e, el, c)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )
                })
              )}
            </g>
          )
        })}

        {/* Глубина */}
        <text x={ox2d+state.totalWidth*scale2d/2} y={oy2d+state.totalHeight*scale2d+18}
          textAnchor="middle" fontSize={9} fill="#6b5d4f" fontWeight="500">
          Глубина: {state.totalDepth} мм
        </text>

        <text x={svgW-6} y={svgH-6} textAnchor="end" fontSize={7.5} fill="#6b5d4f" fillOpacity={0.22}>jygach.bazaar</text>
      </svg>

      {/* Подсказка */}
      {!state.selectedId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-paper/90 backdrop-blur border border-line-soft px-4 py-1.5 rounded-full text-xs text-ink-muted pointer-events-none shadow-soft whitespace-nowrap">
          Клик — выбрать · Drag — переместить · ПКМ — меню · Del — удалить · Ctrl+D — дублировать
        </div>
      )}

      {/* Контекстное меню */}
      {ctxMenu && (
        <div className="fixed z-50 bg-paper border border-line-soft rounded-xl shadow-lift py-1.5 min-w-[170px] overflow-hidden"
          style={{ left: Math.min(ctxMenu.x, window.innerWidth - 180), top: Math.min(ctxMenu.y, window.innerHeight - 180) }}
          onClick={(e) => e.stopPropagation()}>
          {ctxMenu.elementId !== 'body' && <>
            <CtxBtn icon="⎘" label="Дублировать (Ctrl+D)" onClick={() => { onDuplicate(ctxMenu.elementId); setCtxMenu(null) }} />
            <CtxBtn icon="↑" label="На передний план" onClick={() => { dispatch({ type: 'BRING_TO_FRONT', id: ctxMenu.elementId }); setCtxMenu(null) }} />
            <CtxBtn icon="↓" label="На задний план" onClick={() => { dispatch({ type: 'SEND_TO_BACK', id: ctxMenu.elementId }); setCtxMenu(null) }} />
            <div className="h-px bg-line-soft mx-2 my-1" />
            <CtxBtn icon="🗑" label="Удалить" onClick={() => { dispatch({ type: 'DELETE_ELEMENT', id: ctxMenu.elementId }); setCtxMenu(null) }} danger />
          </>}
          <CtxBtn icon="✕" label="Снять выбор" onClick={() => { dispatch({ type: 'SELECT', id: null }); setCtxMenu(null) }} />
        </div>
      )}
    </div>
  )
}

function CtxBtn({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left ${danger ? 'hover:bg-red-50 text-red-500' : 'hover:bg-bg-warm'}`}>
      <span className={`font-mono text-base leading-none ${danger ? '' : 'text-amber-deep'}`}>{icon}</span>
      {label}
    </button>
  )
}

function DimLine({ x1, y1, x2, y2, label, vertical }: {
  x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean
}) {
  const mx = (x1+x2)/2, my = (y1+y2)/2
  const c = '#9c4a0e'
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={0.8} strokeDasharray="3 2"/>
      {vertical ? <>
        <line x1={x1-5} y1={y1} x2={x1+5} y2={y1} stroke={c} strokeWidth={1}/>
        <line x1={x2-5} y1={y2} x2={x2+5} y2={y2} stroke={c} strokeWidth={1}/>
        <rect x={mx-18} y={my-8} width={36} height={16} rx={3} fill="white"/>
        <text x={mx} y={my+4} textAnchor="middle" fontSize={9} fill={c} fontWeight="700">{label}</text>
      </> : <>
        <line x1={x1} y1={y1-5} x2={x1} y2={y1+5} stroke={c} strokeWidth={1}/>
        <line x1={x2} y1={y2-5} x2={x2} y2={y2+5} stroke={c} strokeWidth={1}/>
        <rect x={mx-24} y={my-10} width={48} height={16} rx={3} fill="white"/>
        <text x={mx} y={my+4} textAnchor="middle" fontSize={9} fill={c} fontWeight="700">{label}</text>
      </>}
    </g>
  )
}
