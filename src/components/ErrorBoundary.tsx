import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="font-display text-2xl font-semibold">Что-то пошло не так</h2>
          <p className="text-ink-muted text-sm text-center max-w-sm">
            {this.state.message || 'Произошла непредвиденная ошибка'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
            className="px-6 py-2.5 rounded-xl bg-wood-dark text-paper font-semibold hover:bg-amber-deep transition-colors">
            Перезагрузить страницу
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
