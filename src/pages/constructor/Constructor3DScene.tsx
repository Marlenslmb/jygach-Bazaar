import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ConstructorState, CanvasElement } from './types'
import { MATERIALS } from './types'

const MM = 0.001

const MAT_CFG: Record<string, { color: string; roughness: number; metalness: number }> = {
  oak:    { color: '#c8944a', roughness: 0.75, metalness: 0.00 },
  walnut: { color: '#5a3520', roughness: 0.80, metalness: 0.00 },
  white:  { color: '#f0ece4', roughness: 0.60, metalness: 0.02 },
  black:  { color: '#28241e', roughness: 0.70, metalness: 0.05 },
  ash:    { color: '#bca070', roughness: 0.72, metalness: 0.00 },
  pine:   { color: '#d8b850', roughness: 0.78, metalness: 0.00 },
}

function woodMat(matId: string, shade = 1.0) {
  const cfg = MAT_CFG[matId] ?? MAT_CFG.oak
  const c = new THREE.Color(cfg.color).multiplyScalar(shade)
  return <meshStandardMaterial color={c} roughness={cfg.roughness} metalness={cfg.metalness} />
}

function Plank({ px, py, pz, w, h, d, matId, shade = 1.0, radius = 0.0012 }: {
  px: number; py: number; pz: number
  w: number; h: number; d: number
  matId: string; shade?: number; radius?: number
}) {
  const r = Math.min(radius, w * 0.04, h * 0.04, d * 0.04)
  return (
    <RoundedBox args={[w, h, d]} radius={r} smoothness={3}
      position={[px, py, pz]} castShadow receiveShadow>
      {woodMat(matId, shade)}
    </RoundedBox>
  )
}

// 2D → 3D центр (только X и Y, Z каждый элемент задаёт сам)
function toC(x2d: number, y2d: number, w2d: number, h2d: number, totalH: number) {
  return {
    cx: (x2d + w2d / 2) * MM,
    cy: (totalH - y2d - h2d / 2) * MM,
  }
}

// Определяем тип пресета по label корпуса
function getPreset(s: ConstructorState): string {
  const body = s.elements.find(e => e.id === 'body')
  const label = (body?.label ?? '').toLowerCase()
  if (label.includes('кровать')) return 'bed'
  if (label.includes('стол') && label.includes('компьют')) return 'desk'
  if (label.includes('стол')) return 'table'
  if (label.includes('тумба')) return 'vanity'
  if (label.includes('стул')) return 'chair'
  return 'wardrobe' // шкаф, стеллаж, кухня, купе, прихожая
}

// ══════════════════════════════════════════════
// ЭЛЕМЕНТЫ ШКАФНОГО ТИПА (вид спереди)
// ══════════════════════════════════════════════

function Floor({ W, D }: { W: number; D: number }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, -0.001, D / 2]}>
      <planeGeometry args={[W * 5, D * 6]} />
      <meshStandardMaterial color="#ddd8cc" roughness={0.92} />
    </mesh>
  )
}
function Wall({ W, H, D }: { W: number; H: number; D: number }) {
  return (
    <mesh receiveShadow position={[W / 2, H * 0.55, -0.01]}>
      <planeGeometry args={[W * 4, H * 2.5]} />
      <meshStandardMaterial color="#f4f0e8" roughness={0.96} />
    </mesh>
  )
}

function Cabinet({ s }: { s: ConstructorState }) {
  const W = s.totalWidth * MM, H = s.totalHeight * MM, D = s.totalDepth * MM
  const T = s.boardThickness * MM, m = s.material
  return (
    <group>
      <Plank px={T/2}    py={H/2}   pz={D/2} w={T}     h={H}     d={D} matId={m} shade={0.76} />
      <Plank px={W-T/2}  py={H/2}   pz={D/2} w={T}     h={H}     d={D} matId={m} shade={0.76} />
      <Plank px={W/2}    py={T/2}   pz={D/2} w={W-T*2} h={T}     d={D} matId={m} shade={0.82} />
      <Plank px={W/2}    py={H-T/2} pz={D/2} w={W}     h={T}     d={D} matId={m} shade={0.90} />
      {s.hasBackPanel && (
        <Plank px={W/2} py={H/2} pz={0.006} w={W-T*2} h={H-T*2} d={0.010} matId={m} shade={0.60} radius={0.001} />
      )}
    </group>
  )
}

function ShelfEl({ el, s }: { el: CanvasElement; s: ConstructorState }) {
  const T = s.boardThickness * MM
  const { cx, cy } = toC(el.x, el.y, el.w, el.h, s.totalHeight)
  const W = el.w * MM, D = s.totalDepth * MM
  return (
    <>
      <Plank px={cx} py={cy} pz={D/2} w={W} h={T} d={D} matId={s.material} shade={0.95} />
      {s.hasLighting && (
        <group position={[cx, cy - T/2 - 0.002, D * 0.88]}>
          <mesh><boxGeometry args={[W*0.84, 0.004, 0.006]} />
            <meshStandardMaterial color="#ffe060" emissive="#ffd040" emissiveIntensity={2.2} /></mesh>
          <pointLight color="#ffe8a0" intensity={0.45} distance={0.65} decay={2} />
        </group>
      )}
    </>
  )
}

function DividerEl({ el, s }: { el: CanvasElement; s: ConstructorState }) {
  const T = s.boardThickness * MM
  const { cx, cy } = toC(el.x, el.y, el.w, el.h, s.totalHeight)
  return <Plank px={cx} py={cy} pz={s.totalDepth*MM/2} w={T} h={el.h*MM} d={s.totalDepth*MM} matId={s.material} shade={0.80} />
}

function DrawerEl({ el, s }: { el: CanvasElement; s: ConstructorState }) {
  const { cx, cy } = toC(el.x, el.y, el.w, el.h, s.totalHeight)
  const W = el.w*MM, H = el.h*MM, T = s.boardThickness*MM, D = s.totalDepth*MM
  const BD = D * 0.46  // глубина корпуса ящика
  const m = s.material, hc = m === 'black' ? '#c8a860' : '#807050'
  // Группа стоит на передней плоскости корпуса (z=D в локальных WardrobeScene)
  return (
    <group position={[cx, cy, D]}>
      {/* Фасад: чуть в стороне от передней плоскости (pz=-T/2 — внутрь корпуса) */}
      <Plank px={0} py={0} pz={-T/2} w={W-0.002} h={H-0.002} d={T} matId={m} shade={1.0} />
      {/* Корпус ящика — уходит ВНУТРЬ корпуса (отрицательный Z) */}
      <Plank px={0}         py={-(H-T)/2} pz={-T-BD/2} w={W-T*2} h={T}   d={BD} matId={m} shade={0.72} />
      <Plank px={-(W-T)/2}  py={T/2}      pz={-T-BD/2} w={T}     h={H-T} d={BD} matId={m} shade={0.74} />
      <Plank px={ (W-T)/2}  py={T/2}      pz={-T-BD/2} w={T}     h={H-T} d={BD} matId={m} shade={0.74} />
      {/* Ручка ВЫСТУПАЕТ вперёд от фасада */}
      <mesh position={[0, 0, 0.008]} castShadow rotation={[0, 0, Math.PI/2]}>
        <capsuleGeometry args={[0.0045, Math.min(W*0.28, 0.082), 8, 12]} />
        <meshStandardMaterial color={hc} roughness={0.22} metalness={0.68} />
      </mesh>
    </group>
  )
}

function RodEl({ el, s }: { el: CanvasElement; s: ConstructorState }) {
  const { cx, cy } = toC(el.x, el.y, el.w, el.h, s.totalHeight)
  const W = el.w*MM, D = s.totalDepth*MM
  return (
    <group position={[cx, cy, D*0.74]}>
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.007, 0.007, W*0.90, 20]} />
        <meshStandardMaterial color="#909090" roughness={0.28} metalness={0.72} />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side*W*0.43, 0.013, 0]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, 0.028, 8]} />
          <meshStandardMaterial color="#707070" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// ─── ДВЕРЦА — ИСПРАВЛЕНА ───
// Группа WardrobeScene смещена на [-W/2, 0, -D/2]
// Передняя плоскость корпуса в локальных = z:D
// Дверца: центр доски = D + T/2 (выступает вперёд)
// Ручка: от центра доски ещё +T/2 вперёд → position z = +T/2 + зазор
// Ключевое: ручка position = [x, y, +T/2+gap] → это ВПЕРЁД от центра доски ✓
function DoorEl({ el, s }: { el: CanvasElement; s: ConstructorState }) {
  const { cx, cy } = toC(el.x, el.y, el.w, el.h, s.totalHeight)
  const W = el.w*MM, H = el.h*MM, T = s.boardThickness*MM, D = s.totalDepth*MM
  const hc = s.material === 'black' ? '#c8a860' : '#807050'
  // Дверца снаружи корпуса. Передняя плоскость корпуса = z:D (локально в WardrobeScene)
  // Центр доски дверцы на z = D + T/2 → доска занимает z от D до D+T
  return (
    <group position={[cx, cy, D + T/2]}>
      {/* Доска дверцы */}
      <Plank px={0} py={0} pz={0} w={W-0.001} h={H-0.001} d={T} matId={s.material} shade={1.0} />
      {/* Ручка — длинная, вертикальная, выступает на 15мм от поверхности доски в +Z */}
      <mesh position={[W*0.38, 0, T/2 + 0.012]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, H*0.18, 12]} />
        <meshStandardMaterial color={hc} roughness={0.20} metalness={0.75} />
      </mesh>
      {/* Кронштейны ручки */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[W*0.38, side*H*0.085, T/2 + 0.006]} rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.004, 0.004, 0.012, 8]} />
          <meshStandardMaterial color={hc} roughness={0.20} metalness={0.75} />
        </mesh>
      ))}
    </group>
  )
}

function MirrorEl({ el, s }: { el: CanvasElement; s: ConstructorState }) {
  const { cx, cy } = toC(el.x, el.y, el.w, el.h, s.totalHeight)
  const W3 = el.w*MM, H3 = el.h*MM, T = s.boardThickness*MM, D = s.totalDepth*MM
  const hasDoor = s.elements.some(o =>
    o.type === 'door' &&
    el.x < o.x+o.w && el.x+el.w > o.x &&
    el.y < o.y+o.h && el.y+el.h > o.y
  )
  const Tmm = s.boardThickness
  const inside = el.x > Tmm && el.x+el.w < s.totalWidth-Tmm
  const mirrorZ = hasDoor ? D + T + T*0.3 : inside ? T*2.5 : D
  const fd = T*0.55
  return (
    <group position={[cx, cy, mirrorZ]}>
      <Plank px={0} py={0} pz={fd/2} w={W3} h={H3} d={fd} matId={s.material} shade={0.88} />
      <mesh position={[0, 0, fd+0.003]}>
        <boxGeometry args={[W3-T, H3-T, 0.005]} />
        <meshStandardMaterial color="#b8d8e8" roughness={0.02} metalness={0.08} opacity={0.76} transparent />
      </mesh>
    </group>
  )
}

function WardrobeScene({ s }: { s: ConstructorState }) {
  const W = s.totalWidth*MM, H = s.totalHeight*MM, D = s.totalDepth*MM
  return (
    <group position={[-W/2, 0, -D/2]}>
      <Floor W={W} D={D} />
      <Wall W={W} H={H} D={D} />
      <Cabinet s={s} />
      {s.elements.map(el => {
        if (el.id === 'body') return null
        switch (el.type) {
          case 'shelf':   return <ShelfEl   key={el.id} el={el} s={s} />
          case 'divider': return <DividerEl key={el.id} el={el} s={s} />
          case 'drawer':  return <DrawerEl  key={el.id} el={el} s={s} />
          case 'rod':     return <RodEl     key={el.id} el={el} s={s} />
          case 'mirror':  return <MirrorEl  key={el.id} el={el} s={s} />
          case 'door':    return <DoorEl    key={el.id} el={el} s={s} />
          default: return null
        }
      })}
    </group>
  )
}

// ══════════════════════════════════════════════
// СТОЛ — строим из параметров тела
// ══════════════════════════════════════════════
function TableScene({ s, isDesk = false }: { s: ConstructorState; isDesk?: boolean }) {
  const body = s.elements.find(e => e.id === 'body')!
  const TW = body.w * MM          // ширина
  const TH = body.h * MM          // высота
  const D  = s.totalDepth * MM    // глубина
  const m  = s.material
  const LT = 0.055                // сечение ножки
  const ST = 0.036                // толщина столешницы

  return (
    <group position={[-TW/2, 0, -D/2]}>
      <Floor W={TW} D={D} />
      <Wall W={TW} H={TH} D={D} />
      {/* Столешница */}
      <Plank px={TW/2} py={TH-ST/2} pz={D/2} w={TW} h={ST} d={D} matId={m} shade={1.0} />
      {/* 4 ножки */}
      {[[LT/2+0.015, LT/2+0.02], [TW-LT/2-0.015, LT/2+0.02],
        [LT/2+0.015, D-LT/2-0.02], [TW-LT/2-0.015, D-LT/2-0.02]].map(([lx, lz], i) => (
        <Plank key={i} px={lx} py={(TH-ST)/2} pz={lz} w={LT} h={TH-ST} d={LT} matId={m} shade={i<2?0.80:0.72} />
      ))}
      {/* Проножки */}
      <Plank px={TW/2} py={TH*0.38} pz={LT/2+0.02}    w={TW-LT*2-0.04} h={LT*0.5} d={LT*0.5} matId={m} shade={0.75} />
      <Plank px={TW/2} py={TH*0.38} pz={D-LT/2-0.02}  w={TW-LT*2-0.04} h={LT*0.5} d={LT*0.5} matId={m} shade={0.75} />
      {/* Ящики если компьютерный стол */}
      {isDesk && s.elements.filter(e => e.type === 'drawer').map((dr, i) => {
        const { cx, cy } = toC(dr.x, dr.y, dr.w, dr.h, body.h)
        const W2 = dr.w*MM, H2 = dr.h*MM, T = s.boardThickness*MM
        const hc = m === 'black' ? '#c8a860' : '#807050'
        return (
          <group key={dr.id} position={[cx, cy, 0]}>
            <Plank px={0} py={0} pz={T/2} w={W2-0.002} h={H2-0.002} d={T} matId={m} shade={1.0} />
            <mesh position={[0, 0, T+0.007]} rotation={[0, 0, Math.PI/2]}>
              <capsuleGeometry args={[0.003, Math.min(W2*0.3, 0.07), 6, 8]} />
              <meshStandardMaterial color={hc} roughness={0.22} metalness={0.68} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ══════════════════════════════════════════════
// КРОВАТЬ — реагирует на пользовательские изменения 2D
// ══════════════════════════════════════════════
// ID элементов из bedPreset() в types.ts
const BED_PRESET_IDS = new Set(['body', 'head', 'foot', 'top', 'drw-1', 'drw-2', 'drw-3'])

function BedScene({ s }: { s: ConstructorState }) {
  const body = s.elements.find(e => e.id === 'body')!
  const BW = body.w * MM   // ширина
  const BL = Math.max(s.totalDepth * MM, 1.8)  // длина кровати минимум 1.8м
  const m = s.material
  const T = s.boardThickness * MM
  const RH = 0.26        // высота рамы от пола
  const MAT_H = 0.20     // высота матраса
  const HEAD_H = 0.62    // высота изголовья
  const FOOT_H = 0.32    // высота изножья
  const hc = m === 'black' ? '#c8a860' : '#807050'

  // Пресетные ящики (всегда отображаем как декорацию)
  const presetDrawers = s.elements.filter(e => e.type === 'drawer' && BED_PRESET_IDS.has(e.id))
  const drawerCount = presetDrawers.length || 3
  const dW = (BW - T*2) / drawerCount - 0.01

  // ПОЛЬЗОВАТЕЛЬСКИЕ элементы — те что не из пресета
  const userElements = s.elements.filter(e => !BED_PRESET_IDS.has(e.id))

  return (
    <group position={[-BW/2, 0, -BL/2]}>
      <Floor W={BW} D={BL} />
      <mesh receiveShadow position={[BW/2, HEAD_H*0.6, -0.01]}>
        <planeGeometry args={[BW*3, HEAD_H*3]} />
        <meshStandardMaterial color="#f4f0e8" roughness={0.96} />
      </mesh>

      {/* Изголовье */}
      <Plank px={BW/2} py={HEAD_H/2} pz={T/2} w={BW} h={HEAD_H} d={T} matId={m} shade={1.0} />
      <mesh position={[BW/2, HEAD_H*0.52, T+0.022]} castShadow>
        <boxGeometry args={[BW-T*2, HEAD_H*0.72, 0.042]} />
        <meshStandardMaterial color="#d4b890" roughness={0.85} />
      </mesh>

      {/* Изножье */}
      <Plank px={BW/2} py={FOOT_H/2} pz={BL-T/2} w={BW} h={FOOT_H} d={T} matId={m} shade={0.86} />

      {/* Боковые рейки */}
      <Plank px={T/2}    py={RH/2} pz={BL/2} w={T} h={RH} d={BL-T*2} matId={m} shade={0.80} />
      <Plank px={BW-T/2} py={RH/2} pz={BL/2} w={T} h={RH} d={BL-T*2} matId={m} shade={0.80} />

      {/* Ламели */}
      {Array.from({ length: 9 }).map((_, i) => {
        const z = T + (BL-T*2)/10*(i+1)
        return <Plank key={`l${i}`} px={BW/2} py={RH-0.010} pz={z} w={BW-T*2} h={0.022} d={0.05} matId={m} shade={0.70} />
      })}

      {/* Матрас */}
      <mesh position={[BW/2, RH+MAT_H/2, BL/2]} castShadow receiveShadow>
        <boxGeometry args={[BW-T*2-0.01, MAT_H, BL-T*2-0.01]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.95} />
      </mesh>
      <mesh position={[BW/2, RH+MAT_H+0.003, BL/2]}>
        <boxGeometry args={[BW-T*2-0.015, 0.006, BL-T*2-0.015]} />
        <meshStandardMaterial color="#f8f5f0" roughness={0.98} />
      </mesh>
      {[BW*0.27, BW*0.73].map((px, i) => (
        <mesh key={`p${i}`} position={[px, RH+MAT_H+0.075, BL*0.13]} castShadow>
          <boxGeometry args={[BW*0.34, 0.13, 0.50]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.95} />
        </mesh>
      ))}

      {/* Пресетные ящики снизу */}
      {Array.from({ length: drawerCount }).map((_, i) => {
        const dx = T + i*(dW+0.01) + dW/2
        return (
          <group key={`d${i}`} position={[dx, RH*0.35, BL-0.05]}>
            <Plank px={0} py={0} pz={0} w={dW} h={RH*0.65} d={T} matId={m} shade={0.95} />
            <mesh position={[0, 0, T+0.006]} rotation={[0, 0, Math.PI/2]}>
              <capsuleGeometry args={[0.003, dW*0.30, 6, 8]} />
              <meshStandardMaterial color={hc} roughness={0.25} metalness={0.65} />
            </mesh>
          </group>
        )
      })}

      {/* ПОЛЬЗОВАТЕЛЬСКИЕ ЭЛЕМЕНТЫ — добавляются сбоку от кровати как полки */}
      {userElements.map((el, idx) => {
        // Размещаем сбоку слева от кровати, как тумбы/полки
        const userX = -0.4 - idx * 0.5
        const elH = el.h * MM
        const elW = el.w * MM
        if (el.type === 'shelf' || el.type === 'drawer') {
          return (
            <group key={el.id} position={[userX, RH + idx*0.3, BL/2]}>
              <Plank px={0} py={elH/2} pz={0} w={elW} h={elH} d={0.30} matId={m} shade={0.90} />
              {el.type === 'drawer' && (
                <mesh position={[0, elH/2, 0.16]} rotation={[0, 0, Math.PI/2]}>
                  <capsuleGeometry args={[0.003, elW*0.3, 6, 8]} />
                  <meshStandardMaterial color={hc} roughness={0.25} metalness={0.65} />
                </mesh>
              )}
            </group>
          )
        }
        return null
      })}
    </group>
  )
}


// ══════════════════════════════════════════════
// ТУМБА ПОД РАКОВИНУ
// ══════════════════════════════════════════════
function VanityScene({ s }: { s: ConstructorState }) {
  const body = s.elements.find(e => e.id === 'body')!
  const VW = body.w * MM
  const VH = body.h * MM
  const D  = s.totalDepth * MM
  const m  = s.material, T = s.boardThickness * MM
  const hc = m === 'black' ? '#c8a860' : '#807050'

  return (
    <group position={[-VW/2, 0, -D/2]}>
      <Floor W={VW} D={D} />
      <Wall W={VW} H={VH} D={D} />
      {/* Корпус */}
      <Plank px={T/2}    py={VH/2} pz={D/2} w={T}     h={VH}   d={D} matId={m} shade={0.76} />
      <Plank px={VW-T/2} py={VH/2} pz={D/2} w={T}     h={VH}   d={D} matId={m} shade={0.76} />
      <Plank px={VW/2}   py={T/2}  pz={D/2} w={VW-T*2} h={T}   d={D} matId={m} shade={0.82} />
      {/* Столешница */}
      <Plank px={VW/2} py={VH-T/2} pz={D/2} w={VW} h={T} d={D} matId={m} shade={1.0} />
      {/* Раковина (врезная) */}
      <mesh position={[VW/2, VH+0.01, D/2]} castShadow>
        <cylinderGeometry args={[VW*0.22, VW*0.18, 0.14, 32]} />
        <meshStandardMaterial color="#e8f0f5" roughness={0.15} metalness={0.3} />
      </mesh>
      {/* Смеситель */}
      <mesh position={[VW/2, VH+0.12, D*0.25]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.15, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Задняя стенка */}
      {s.hasBackPanel && (
        <Plank px={VW/2} py={VH/2} pz={0.006} w={VW-T*2} h={VH-T*2} d={0.010} matId={m} shade={0.60} radius={0.001} />
      )}
      {/* Дверцы (2 штуки) */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[VW/2 + side*VW*0.25, (VH-T)*0.5+T/2, D+T/2]}>
          <Plank px={0} py={0} pz={0} w={VW/2-T-0.005} h={VH-T-0.005} d={T} matId={m} shade={1.0} />
          <mesh position={[side*(-VW*0.08), 0, T/2+0.008]} castShadow>
            <sphereGeometry args={[0.012, 12, 8]} />
            <meshStandardMaterial color={hc} roughness={0.25} metalness={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  )
}


// ══════════════════════════════════════════════
// СТУЛ
// ══════════════════════════════════════════════
function ChairScene({ s }: { s: ConstructorState }) {
  const body = s.elements.find(e => e.id === 'body')!
  const SW = body.w * MM           // ширина стула
  const SH = body.h * MM           // высота стула (со спинкой)
  const SD = 0.46                  // глубина стула в метрах
  const m = s.material
  const LT = 0.034                 // сечение ножки
  const SEAT_T = 0.034             // толщина сиденья
  const BACK_H = 0.42              // высота спинки

  const seatY = SH - BACK_H - SEAT_T  // высота на которой сиденье

  return (
    <group position={[-SW/2, 0, -SD/2]}>
      <Floor W={SW} D={SD} />
      <Wall W={SW} H={SH} D={SD} />

      {/* 4 ножки */}
      {[
        [LT/2, LT/2],
        [SW-LT/2, LT/2],
        [LT/2, SD-LT/2],
        [SW-LT/2, SD-LT/2]
      ].map(([px, pz], i) => (
        <Plank key={`leg${i}`} px={px} py={seatY/2} pz={pz}
          w={LT} h={seatY} d={LT} matId={m} shade={i<2 ? 0.85 : 0.78} />
      ))}

      {/* Сиденье */}
      <Plank px={SW/2} py={seatY + SEAT_T/2} pz={SD/2}
        w={SW} h={SEAT_T} d={SD} matId={m} shade={1.0} />

      {/* Мягкая обивка */}
      <mesh position={[SW/2, seatY + SEAT_T + 0.012, SD/2]} castShadow>
        <boxGeometry args={[SW-0.02, 0.024, SD-0.02]} />
        <meshStandardMaterial color="#d4b890" roughness={0.85} />
      </mesh>

      {/* Задние стойки спинки (продолжение задних ножек) */}
      {[LT/2, SW-LT/2].map((px, i) => (
        <Plank key={`back-leg${i}`} px={px} py={seatY + SEAT_T + BACK_H/2} pz={SD-LT/2}
          w={LT} h={BACK_H} d={LT} matId={m} shade={0.82} />
      ))}

      {/* Перекладина спинки сверху */}
      <Plank px={SW/2} py={SH - 0.04} pz={SD-LT/2}
        w={SW-LT*2} h={0.05} d={LT*0.6} matId={m} shade={0.90} />

      {/* Средняя перекладина */}
      <Plank px={SW/2} py={seatY + SEAT_T + BACK_H*0.5} pz={SD-LT/2}
        w={SW-LT*2} h={0.04} d={LT*0.5} matId={m} shade={0.85} />

      {/* Проножки между передними и задними ножками */}
      <Plank px={LT/2} py={seatY*0.4} pz={SD/2}
        w={LT*0.5} h={LT*0.5} d={SD-LT} matId={m} shade={0.75} />
      <Plank px={SW-LT/2} py={seatY*0.4} pz={SD/2}
        w={LT*0.5} h={LT*0.5} d={SD-LT} matId={m} shade={0.75} />
    </group>
  )
}

// ══════════════════════════════════════════════
// ГЛАВНАЯ СЦЕНА
// ══════════════════════════════════════════════
function Scene({ s }: { s: ConstructorState }) {
  const preset = getPreset(s)
  if (preset === 'table') return <TableScene s={s} />
  if (preset === 'desk')  return <TableScene s={s} isDesk />
  if (preset === 'bed')   return <BedScene s={s} />
  if (preset === 'vanity') return <VanityScene s={s} />
  if (preset === 'chair')  return <ChairScene s={s} />
  return <WardrobeScene s={s} />
}

function Spinner() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 2 })
  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <torusGeometry args={[0.22, 0.05, 8, 24]} />
      <meshStandardMaterial color="#c8651b" roughness={0.3} />
    </mesh>
  )
}

// ══════════════════════════════════════════════
// ЭКСПОРТ
// ══════════════════════════════════════════════
export function Constructor3DScene({ state }: { state: ConstructorState }) {
  const preset = getPreset(state)
  const body   = state.elements.find(e => e.id === 'body')
  if (!body) return null

  const isTable = preset === 'table' || preset === 'desk'
  const isBed   = preset === 'bed'
  const isChair = preset === 'chair'
  const W = body.w * MM
  const H = isTable ? body.h*MM : isBed ? 1.5 : state.totalHeight*MM
  const D = state.totalDepth * MM

  const target: [number, number, number] = [0, H*0.45, 0]
  const camPos: [number, number, number] = [
    isBed ? W*0.6 : W*1.5,
    isBed ? H*2.5 : H*0.90,
    isBed ? Math.max(D*2.5, 3.5) : isTable ? D*3.5 : D*3.0
  ]

  return (
    <div className="w-full h-full relative"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #f5f0e8 0%, #e0d8cc 100%)' }}>
      <Canvas shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
        dpr={[1, 2]}>
        <PerspectiveCamera makeDefault fov={36} position={camPos} near={0.01} far={30} />
        <OrbitControls target={target} minDistance={0.3} maxDistance={14}
          maxPolarAngle={Math.PI/2+0.06} enableDamping dampingFactor={0.06} />
        <ambientLight intensity={0.52} color="#fff8f0" />
        <directionalLight position={[4, 6, 5]} intensity={1.5} color="#fff5e8" castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1} shadow-camera-far={25}
          shadow-camera-left={-4} shadow-camera-right={4}
          shadow-camera-top={4} shadow-camera-bottom={-4}
          shadow-bias={-0.0005} />
        <directionalLight position={[-3, 4, -2]} intensity={0.28} color="#c8d8f0" />
        <pointLight position={[0, H*1.4, D]} intensity={0.3} color="#fff0e0" />
        <Environment preset="apartment" />
        <ContactShadows position={[0,0,0]} opacity={0.28} scale={[W*4,D*4]} blur={2.0} far={0.8} color="#2a1f17" />
        <Suspense fallback={<Spinner />}>
          <Scene s={state} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-paper/85 backdrop-blur border border-line-soft px-5 py-2 rounded-full text-xs text-ink-muted pointer-events-none shadow-soft whitespace-nowrap">
        <span>🖱️ ЛКМ — вращать</span>
        <span className="opacity-30">·</span>
        <span>ПКМ — панорама</span>
        <span className="opacity-30">·</span>
        <span>⚲ Колёсико — зум</span>
      </div>

      <div className="absolute top-4 left-4 bg-paper/85 backdrop-blur border border-line-soft px-3 py-2 rounded-xl text-xs pointer-events-none">
        <div className="font-semibold text-ink text-sm mb-0.5">{MATERIALS[state.material].label}</div>
        <div className="text-ink-muted">{state.totalWidth} × {state.totalDepth} × {state.totalHeight} мм</div>
        {state.hasLighting && <div className="text-amber font-medium mt-0.5">✦ LED подсветка</div>}
      </div>
    </div>
  )
}
