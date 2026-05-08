import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send,
  Paperclip,
  ArrowLeft,
  FileText,
  MessageCircle,
} from 'lucide-react'
import { messagesApi } from '@/api/client'
import { useAppStore } from '@/store/useAppStore'
import { cn, timeAgo } from '@/lib/utils'
import type { ChatMessage } from '@/api/types'

export function MessagesPage() {
  const { id: activeThreadId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const qc = useQueryClient()

  const [text, setText] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Список тредов
  const { data: threads = [] } = useQuery({
    queryKey: ['threads'],
    queryFn: () => messagesApi.getThreads(),
    refetchInterval: 5000, // опрашиваем каждые 5 сек (в боевой — websocket)
  })

  // Выбранный тред — берём первый если id не задан
  const currentThreadId = activeThreadId ?? threads[0]?.id
  const currentThread = threads.find((t) => t.id === currentThreadId)

  // Сообщения активного треда
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', currentThreadId],
    queryFn: () => messagesApi.getMessages(currentThreadId!),
    enabled: !!currentThreadId,
    refetchInterval: 3000,
  })

  // Помечаем прочитанным при открытии
  useEffect(() => {
    if (currentThreadId) {
      messagesApi.markRead(currentThreadId).then(() => {
        qc.invalidateQueries({ queryKey: ['threads'] })
      })
    }
  }, [currentThreadId, qc])

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Отправка сообщения
  const sendMutation = useMutation({
    mutationFn: (payload: { text: string; attachment?: ChatMessage['attachment'] }) =>
      messagesApi.send(currentThreadId!, payload.text, payload.attachment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', currentThreadId] })
      qc.invalidateQueries({ queryKey: ['threads'] })
      setText('')
    },
  })

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || !currentThreadId) return
    sendMutation.mutate({ text: trimmed })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const attachProject = () => {
    setShowAttachMenu(false)
    sendMutation.mutate({
      text: 'Прикрепляю эскиз из конструктора:',
      attachment: { type: 'project', label: 'Эскиз шкаф-купе 2200мм.pdf' },
    })
  }

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  return (
    <div className="animate-page-in -mt-4">
      {/* На мобиле — или список, или чат */}
      <div className="h-[calc(100vh-140px)] min-h-[500px] flex border border-line-soft rounded-2xl overflow-hidden bg-paper shadow-soft">

        {/* ===== LEFT: Thread list ===== */}
        <aside
          className={cn(
            'w-full md:w-[300px] lg:w-[340px] border-r border-line-soft flex flex-col shrink-0',
            currentThreadId && 'hidden md:flex'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-line-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Сообщения
              </h2>
              {totalUnread > 0 && (
                <span className="w-6 h-6 rounded-full bg-amber-deep text-paper text-xs font-bold grid place-items-center">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-ink-muted">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                Нет сообщений
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/messages/${t.id}`)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-line-soft/60 transition-colors hover:bg-bg-warm',
                    t.id === currentThreadId && 'bg-bg-warm'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-full grid place-items-center font-display font-bold text-base text-paper',
                        t.participantRole === 'master' && 'bg-wood-dark',
                        t.participantRole === 'supplier' && 'bg-moss',
                        t.participantRole === 'customer' && 'bg-amber-deep'
                      )}
                    >
                      {t.participantInitial}
                    </div>
                    {t.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-deep border-2 border-paper" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={cn(
                          'font-semibold text-sm truncate',
                          t.unread > 0 && 'text-ink'
                        )}
                      >
                        {t.participantName}
                      </span>
                      <span className="text-[11px] text-ink-muted shrink-0 ml-2">
                        {timeAgo(t.lastMessageAt)}
                      </span>
                    </div>
                    {t.orderTitle && (
                      <div className="text-[11px] text-amber-deep font-medium mb-0.5 truncate">
                        {t.orderTitle}
                      </div>
                    )}
                    <p
                      className={cn(
                        'text-xs truncate',
                        t.unread > 0 ? 'text-ink font-medium' : 'text-ink-muted'
                      )}
                    >
                      {t.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ===== RIGHT: Chat area ===== */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0',
            !currentThreadId && 'hidden md:flex'
          )}
        >
          {!currentThread ? (
            <div className="flex-1 grid place-items-center text-ink-muted">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-display text-lg">Выберите диалог</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-line-soft flex items-center gap-3 bg-bg-warm/50">
                <button
                  onClick={() => navigate('/messages')}
                  className="md:hidden w-8 h-8 rounded-full hover:bg-bg-warm grid place-items-center"
                >
                  <ArrowLeft size={16} />
                </button>
                <div
                  className={cn(
                    'w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm text-paper shrink-0',
                    currentThread.participantRole === 'master' && 'bg-wood-dark',
                    currentThread.participantRole === 'supplier' && 'bg-moss',
                  )}
                >
                  {currentThread.participantInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{currentThread.participantName}</div>
                  {currentThread.orderTitle && (
                    <div className="text-xs text-amber-deep truncate">
                      По заявке: {currentThread.orderTitle}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-moss font-medium">
                  <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
                  онлайн
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                {groupByDate(messages).map((group) => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-line-soft" />
                      <span className="text-[11px] text-ink-muted font-medium px-2">
                        {group.date}
                      </span>
                      <div className="flex-1 h-px bg-line-soft" />
                    </div>
                    {group.messages.map((msg, i) => {
                      const prevMsg = group.messages[i - 1]
                      const showAvatar = !msg.isOwn && prevMsg?.senderId !== msg.senderId
                      return (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          showAvatar={showAvatar}
                        />
                      )
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 py-3 border-t border-line-soft bg-paper relative">
                {showAttachMenu && (
                  <div className="absolute bottom-full left-4 mb-2 bg-paper border border-line-soft rounded-xl shadow-lift overflow-hidden z-10">
                    <button
                      onClick={attachProject}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-bg-warm w-full text-left transition-colors"
                    >
                      <FileText size={16} className="text-amber-deep" />
                      <div>
                        <div className="font-medium">Прикрепить проект</div>
                        <div className="text-xs text-ink-muted">Эскиз из конструктора</div>
                      </div>
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={cn(
                      'w-9 h-9 rounded-full grid place-items-center shrink-0 transition-colors mb-0.5',
                      showAttachMenu
                        ? 'bg-amber-deep text-paper'
                        : 'bg-bg-warm text-ink-muted hover:text-ink'
                    )}
                    title="Прикрепить"
                  >
                    <Paperclip size={15} />
                  </button>
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value)
                      // Авто-высота
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Написать сообщение... (Enter — отправить)"
                    rows={1}
                    className="flex-1 bg-bg-warm border border-line rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-deep focus:bg-paper transition-colors"
                    style={{ maxHeight: 120 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sendMutation.isPending}
                    className={cn(
                      'w-9 h-9 rounded-full grid place-items-center shrink-0 transition-all mb-0.5',
                      text.trim()
                        ? 'bg-wood-dark text-paper hover:bg-amber-deep'
                        : 'bg-bg-warm text-ink-muted cursor-not-allowed'
                    )}
                  >
                    <Send size={15} />
                  </button>
                </div>
                <div className="text-[10px] text-ink-muted mt-1.5 ml-11">
                  Shift+Enter — новая строка
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Компонент одного сообщения
function MessageBubble({ msg, showAvatar }: { msg: ChatMessage; showAvatar: boolean }) {
  return (
    <div
      className={cn(
        'flex items-end gap-2 mb-1',
        msg.isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar placeholder для alignment */}
      {!msg.isOwn && (
        <div className="w-7 shrink-0">
          {showAvatar && (
            <div className="w-7 h-7 rounded-full bg-wood-dark text-paper grid place-items-center text-[11px] font-bold font-display">
              {msg.senderName[0]}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-[72%] flex flex-col',
          msg.isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Attachment */}
        {msg.attachment && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl mb-1 text-sm',
              msg.isOwn
                ? 'bg-amber-deep/10 text-amber-deep'
                : 'bg-bg-warm text-ink-soft'
            )}
          >
            <FileText size={14} />
            <span className="font-medium text-xs">{msg.attachment.label}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            msg.isOwn
              ? 'bg-wood-dark text-paper rounded-br-md'
              : 'bg-bg-warm text-ink rounded-bl-md'
          )}
        >
          {msg.text}
        </div>

        {/* Time */}
        <div className="text-[10px] text-ink-muted mt-0.5 px-1">
          {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}

// Группируем сообщения по дате
function groupByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.createdAt)
    const last = groups[groups.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      groups.push({ date, messages: [msg] })
    }
  }
  return groups
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return 'Сегодня'
  if (isYesterday) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}
