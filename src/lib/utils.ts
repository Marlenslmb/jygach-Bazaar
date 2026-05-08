import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Стандартный helper для классов в Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Форматирование цены в сомах
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return new Intl.NumberFormat('ru-RU').format(price)
  }
  return price.toString()
}

// Сокращённое форматирование (180000 -> 180К)
export function formatShortPrice(price: number): string {
  if (price >= 1000) return `${Math.round(price / 1000)}К`
  return price.toString()
}

// Относительное время (2ч назад)
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)

  if (minutes < 60) return `${minutes} мин назад`
  if (hours < 24) return `${hours} ч назад`
  if (days === 1) return 'Вчера'
  if (days < 7) return `${days} дн назад`
  if (weeks < 4) return `${weeks} нед назад`
  return new Date(iso).toLocaleDateString('ru-RU')
}
