import { useCallback, useRef } from 'react'
import type { ConstructorState } from './types'
import { MATERIALS } from './types'

export function useExport(state: ConstructorState) {
  // Сохраняем актуальный state в ref для колбэков
  const stateRef = useRef(state)
  stateRef.current = state

  const doExport = useCallback(async (format: 'png' | 'pdf') => {
    const s = stateRef.current
    const mat = MATERIALS[s.material]

    // ——— Рисуем чертёж на canvas напрямую (без SVG сериализации)
    const SCALE = 0.22          // мм → px
    const PAD = 60              // отступ для размерных линий
    const W = Math.round(s.totalWidth * SCALE + PAD * 2)
    const H = Math.round(s.totalHeight * SCALE + PAD * 2)
    const RETINA = 2            // для чёткости

    const canvas = document.createElement('canvas')
    canvas.width = W * RETINA
    canvas.height = H * RETINA
    const ctx = canvas.getContext('2d')!
    ctx.scale(RETINA, RETINA)

    // Фон страницы
    ctx.fillStyle = '#faf6ec'
    ctx.fillRect(0, 0, W, H)

    // Тень под чертежом
    ctx.shadowColor = 'rgba(28,22,18,0.12)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 4
    ctx.fillStyle = '#faf6ec'
    ctx.roundRect(PAD - 8, PAD - 8, s.totalWidth * SCALE + 16, s.totalHeight * SCALE + 16, 6)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Сетка внутри корпуса
    ctx.strokeStyle = 'rgba(107,93,79,0.06)'
    ctx.lineWidth = 0.5
    const gs = 10 * SCALE
    for (let x = PAD; x <= PAD + s.totalWidth * SCALE; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + s.totalHeight * SCALE); ctx.stroke()
    }
    for (let y = PAD; y <= PAD + s.totalHeight * SCALE; y += gs) {
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + s.totalWidth * SCALE, y); ctx.stroke()
    }

    // ——— Рисуем элементы
    for (const el of s.elements) {
      const x = PAD + el.x * SCALE
      const y = PAD + el.y * SCALE
      const w = el.w * SCALE
      const h = Math.max(el.h * SCALE, 1)

      let fill = mat.fill
      let stroke = mat.stroke
      let alpha = 0.9

      if (el.type === 'body')    { alpha = 0.15 }
      if (el.type === 'rod')     { fill = '#909090'; stroke = '#606060'; alpha = 1 }
      if (el.type === 'mirror')  { fill = '#c0dce8'; stroke = '#80b0c0'; alpha = 0.65 }

      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = el.type === 'body' ? 2.5 : 1.5
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 2)
      ctx.fill()
      ctx.stroke()
      ctx.globalAlpha = 1

      // Метки элементов
      if (el.label && el.id !== 'body' && w > 30 && h > 12) {
        ctx.fillStyle = el.type === 'rod' ? '#fff' : mat.stroke
        ctx.globalAlpha = 0.6
        ctx.font = `600 ${Math.min(9, h * 0.4)}px Manrope, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(el.label, x + w / 2, y + h / 2)
        ctx.globalAlpha = 1
      }

      // LED
      if (s.hasLighting && el.type === 'shelf' && w > 20) {
        ctx.strokeStyle = '#ffd060'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.85
        ctx.beginPath(); ctx.moveTo(x + 4, y + 1); ctx.lineTo(x + w - 4, y + 1); ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    // ——— Размерные линии
    const dimColor = '#9c4a0e'
    ctx.strokeStyle = dimColor
    ctx.fillStyle = dimColor
    ctx.lineWidth = 1
    ctx.font = 'bold 9px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Ширина
    const dimY = PAD - 22
    ctx.beginPath(); ctx.moveTo(PAD, dimY); ctx.lineTo(PAD + s.totalWidth * SCALE, dimY); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD, dimY - 5); ctx.lineTo(PAD, dimY + 5); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD + s.totalWidth * SCALE, dimY - 5); ctx.lineTo(PAD + s.totalWidth * SCALE, dimY + 5); ctx.stroke()
    ctx.fillText(`${s.totalWidth} мм`, PAD + s.totalWidth * SCALE / 2, dimY - 1)

    // Высота
    const dimX = PAD + s.totalWidth * SCALE + 22
    ctx.beginPath(); ctx.moveTo(dimX, PAD); ctx.lineTo(dimX, PAD + s.totalHeight * SCALE); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(dimX - 5, PAD); ctx.lineTo(dimX + 5, PAD); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(dimX - 5, PAD + s.totalHeight * SCALE); ctx.lineTo(dimX + 5, PAD + s.totalHeight * SCALE); ctx.stroke()
    ctx.save(); ctx.translate(dimX + 12, PAD + s.totalHeight * SCALE / 2); ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${s.totalHeight} мм`, 0, 0); ctx.restore()

    // Глубина внизу
    ctx.globalAlpha = 0.6
    ctx.font = '500 9px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Глубина: ${s.totalDepth} мм`, PAD + s.totalWidth * SCALE / 2, PAD + s.totalHeight * SCALE + 16)
    ctx.globalAlpha = 1

    // Watermark
    ctx.globalAlpha = 0.2
    ctx.font = '500 8px Manrope, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('jygach.bazaar', W - 6, H - 6)
    ctx.globalAlpha = 1

    if (format === 'png') {
      // ——— PNG скачать
      const a = document.createElement('a')
      a.download = `jygach-project-${Date.now()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } else {
      // ——— PDF
      const { jsPDF } = await import('jspdf')
      const pw = 297; const ph = 210  // A4 landscape
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Шапка
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.setTextColor(28, 22, 18)
      pdf.text('Jygach Bazaar — Проект мебели', 14, 14)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(107, 93, 79)
      pdf.text(`Материал: ${mat.label}`, 14, 22)
      pdf.text(`Размеры: ${s.totalWidth} × ${s.totalDepth} × ${s.totalHeight} мм  |  Толщина: ${s.boardThickness} мм`, 60, 22)
      pdf.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, pw - 14, 22, { align: 'right' })

      // Линия-разделитель
      pdf.setDrawColor(217, 205, 182)
      pdf.setLineWidth(0.3)
      pdf.line(14, 25, pw - 14, 25)

      // Чертёж — масштабируем в A4
      const imgData = canvas.toDataURL('image/png')
      const maxW = pw - 28
      const maxH = ph - 44
      const ratio = Math.min(maxW / W, maxH / H)
      const iW = W * ratio; const iH = H * ratio
      const ix = 14 + (maxW - iW) / 2
      pdf.addImage(imgData, 'PNG', ix, 28, iW, iH)

      // Таблица характеристик внизу
      const specs = [
        ['Ширина', `${s.totalWidth} мм`],
        ['Глубина', `${s.totalDepth} мм`],
        ['Высота', `${s.totalHeight} мм`],
        ['Толщина', `${s.boardThickness} мм`],
        ['Подсветка', s.hasLighting ? 'Да' : 'Нет'],
        ['Задняя стенка', s.hasBackPanel ? 'Да' : 'Нет'],
      ]
      pdf.setFontSize(8)
      pdf.setTextColor(28, 22, 18)
      specs.forEach(([k, v], i) => {
        const sx = 14 + i * 46; const sy = ph - 12
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(107, 93, 79)
        pdf.text(k, sx, sy - 4)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(28, 22, 18)
        pdf.text(v, sx, sy)
      })

      // Подвал
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(156, 74, 14)
      pdf.text('jygach.bazaar — Мебельная мастерская Кыргызстана', pw / 2, ph - 3, { align: 'center' })

      pdf.save(`jygach-project-${Date.now()}.pdf`)
    }
  }, [])

  const exportPng = useCallback(() => doExport('png'), [doExport])
  const exportPdf = useCallback(() => doExport('pdf'), [doExport])

  return { exportPng, exportPdf }
}
