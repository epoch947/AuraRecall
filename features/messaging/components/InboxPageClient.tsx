'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type {
  ConversationDetail,
  ConversationSummary,
  MessageRecord,
} from '@/features/messaging/contracts'

// ─── Conversation list item ─────────────────────────────────────────────────

function ConversationItem({ conv, onClick }: { conv: ConversationSummary; onClick: () => void }) {
  const latest = conv.messages[0]
  const pending = conv.isPendingForCurrentUser

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full text-left flex items-start gap-4 px-8 py-5
                 border-b border-oatmeal/8 hover:bg-oatmeal/5 transition-colors duration-200"
    >
      {/* Echo color dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: conv.echo.color }}
      />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className={`font-serif text-sm leading-snug truncate
                       ${pending ? 'text-oatmeal' : 'text-oatmeal/50'}`}
        >
          {latest?.content ?? '—'}
        </p>
        <p className="font-mono text-[9px] text-oatmeal/25 tracking-[0.25em] uppercase truncate">
          {conv.echo.weather} ·{' '}
          {new Date(conv.updatedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
      {pending && <div className="w-1.5 h-1.5 rounded-full bg-oatmeal/40 flex-shrink-0 mt-2" />}
    </motion.button>
  )
}

// ─── Chat view ─────────────────────────────────────────────────────────────────

function ChatView({ conv, onBack }: { conv: ConversationDetail; onBack: () => void }) {
  const [messages, setMessages] = useState<MessageRecord[]>(conv.messages)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    const text = reply.trim()
    if (!text || sending) return
    setSending(true)
    setReplyError(null)
    try {
      const res = await fetch(`/api/inbox/${conv.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.message) throw new Error(data.error ?? 'Reply failed')
      setMessages((prev) => [...prev, data.message as MessageRecord])
      setReply('')
    } catch {
      setReplyError('The reply could not be sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-charcoal">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-oatmeal/8 px-8 py-5 flex items-center gap-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-[10px] text-oatmeal/30
                     hover:text-oatmeal/70 tracking-[0.25em] uppercase transition-colors duration-200"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: conv.echo.color }} />
          <p className="font-serif text-sm text-oatmeal/40 italic truncate max-w-xs">
            {conv.echo.insight}
          </p>
        </div>
      </div>

      {/* Messages — plain text, no bubbles */}
      <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col gap-8">
        {messages.map((msg) => {
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`flex flex-col gap-1 ${msg.isMine ? 'items-end' : 'items-start'}`}
            >
              <p
                className={`font-serif text-base leading-relaxed max-w-lg
                             ${msg.isMine ? 'text-oatmeal/60 text-right' : 'text-oatmeal text-left'}`}
              >
                {msg.content}
              </p>
              <span className="font-mono text-[9px] text-oatmeal/20 tracking-[0.2em]">
                {new Date(msg.createdAt).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="flex-shrink-0 border-t border-oatmeal/8 px-8 py-5 flex items-center gap-4">
        <input
          type="text"
          placeholder="Say something quietly…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendReply()
          }}
          disabled={sending}
          className="flex-1 bg-transparent border-b border-oatmeal/15 focus:border-oatmeal/40
                     font-serif text-sm text-oatmeal/70 placeholder:text-oatmeal/20
                     outline-none py-1 transition-colors duration-200"
        />
        <button
          type="button"
          onClick={sendReply}
          disabled={!reply.trim() || sending}
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-oatmeal/30
                     hover:text-oatmeal/70 disabled:opacity-20 transition-colors duration-200"
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
      {replyError && (
        <p className="px-8 pb-4 font-mono text-[9px] text-oatmeal/40 tracking-[0.15em]">
          {replyError}
        </p>
      )}
    </div>
  )
}

// ─── Inbox page ─────────────────────────────────────────────────────────────────

export default function InboxPageClient() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeConv, setActiveConv] = useState<ConversationDetail | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadConversations() {
      try {
        const response = await fetch('/api/inbox', { signal: controller.signal })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error ?? 'Inbox failed')
        setConversations(data.conversations ?? [])
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError('The inbox could not be loaded. Please try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadConversations()
    return () => controller.abort()
  }, [])

  async function openConversation(id: string) {
    setLoadError(null)
    try {
      const response = await fetch(`/api/inbox/${id}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.conversation) throw new Error(data.error ?? 'Conversation failed')
      setActiveConv(data.conversation as ConversationDetail)
    } catch {
      setLoadError('That conversation could not be opened.')
    }
  }

  return (
    <AnimatePresence mode="wait">
      {activeConv ? (
        <motion.div
          key="chat"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChatView conv={activeConv} onBack={() => setActiveConv(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-charcoal"
        >
          {/* Header */}
          <div
            className="sticky top-0 z-20 bg-charcoal/90 backdrop-blur-sm border-b border-oatmeal/8
                          px-8 py-5 flex items-center gap-6"
          >
            <Link
              href="/resonance"
              className="flex items-center gap-2 font-mono text-[10px] text-oatmeal/30
                         hover:text-oatmeal/70 tracking-[0.25em] uppercase transition-colors duration-200"
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Pool
            </Link>
            <p className="font-mono text-[10px] text-oatmeal/20 tracking-[0.35em] uppercase">
              Inbox
            </p>
          </div>

          {/* Conversation list */}
          {loading && (
            <motion.p
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-serif text-sm text-oatmeal/30 italic text-center pt-24"
            >
              Reaching into the void…
            </motion.p>
          )}

          {!loading && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-3 pt-24 opacity-30">
              <p className="font-serif text-sm text-oatmeal italic">No whispers yet.</p>
              <p className="font-mono text-[10px] text-oatmeal tracking-[0.3em] uppercase">
                Visit the Resonance Pool to begin.
              </p>
            </div>
          )}

          {loadError && (
            <p className="font-mono text-[10px] text-oatmeal/40 text-center pt-8 tracking-[0.15em]">
              {loadError}
            </p>
          )}

          <div className="flex flex-col">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                onClick={() => openConversation(conv.id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
