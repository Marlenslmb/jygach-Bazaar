import { useAppStore } from '@/store/useAppStore'

export function Toast() {
  const toast = useAppStore((s) => s.toast)
  return (
    <div
      className={`fixed bottom-6 right-6 bg-wood-dark text-paper px-5 py-3.5 rounded-xl text-sm font-medium shadow-lift z-50 flex items-center gap-2.5 transition-all duration-300 ${
        toast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-amber-soft" />
      <span>{toast?.message}</span>
    </div>
  )
}
