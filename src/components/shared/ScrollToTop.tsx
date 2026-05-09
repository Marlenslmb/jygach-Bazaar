import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Чат управляет скроллом сам — не трогаем его
    if (pathname.startsWith('/messages')) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
