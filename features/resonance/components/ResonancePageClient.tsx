'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic } from 'lucide-react'
import Link from 'next/link'
import { useRitualStore } from '@/features/journal/store/useRitualStore'
import type { PoolEcho } from '@/features/resonance/contracts'

interface WhisperState {
  echoId: string
  content: string
  status: 'idle' | 'sending' | 'sent' | 'error'
}

export default function ResonancePageClient({ initialEchoes }: { initialEchoes: PoolEcho[] }) {
  const userId = useRitualStore((s) => s.userId)
  const [echoes] = useState<PoolEcho[]>(initialEchoes)
  const [whisper, setWhisper] = useState<WhisperState | null>(null)

  async function sendWhisper() {
    if (!whisper || !userId || whisper.status === 'sending') return
    const echo = echoes.find((e) => e.id === whisper.echoId)
    if (!echo?.authorId) return

    setWhisper((w) => (w ? { ...w, status: 'sending' } : w))

    try {
      const res = await fetch('/api/whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          echoId: echo.id,
          initiatorId: userId,
          receiverId: echo.authorId,
          content: whisper.content,
        }),
      })
      if (!res.ok) throw new Error()
      setWhisper((w) => (w ? { ...w, status: 'sent' } : w))
      setTimeout(() => setWhisper(null), 2800)
    } catch {
      setWhisper((w) => (w ? { ...w, status: 'error' } : w))
    }
  }

  return (
    <div className="min-h-screen bg-oatmeal">
      {/* Header */}
      <div
        className="sticky top-0 z-20 bg-oatmeal/90 backdrop-blur-sm border-b border-sage/15
                      px-8 py-5 flex items-center gap-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-[10px] text-charcoal/40
                     hover:text-charcoal tracking-[0.25em] uppercase transition-colors duration-300"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Return
        </Link>
        <p className="font-mono text-[10px] text-charcoal/30 tracking-[0.35em] uppercase">
          Resonance Pool
        </p>
        <Link
          href="/inbox"
          className="ml-auto font-mono text-[10px] text-charcoal/40 hover:text-charcoal
                     tracking-[0.25em] uppercase transition-colors duration-300"
        >
          Inbox
        </Link>
      </div>

      {/* Echo list */}
      <div className="max-w-2xl mx-auto px-8 py-16 flex flex-col gap-8">
        {echoes.length === 0 && (
          <p className="font-serif text-sm text-charcoal/40 italic text-center pt-24">
            The pool is still. No echoes yet.
          </p>
        )}

        {echoes.map((echo) => {
          const isWhispering = whisper?.echoId === echo.id
          const isOwn = userId && echo.authorId === userId

          return (
            <motion.div
              key={echo.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex gap-5"
            >
              {/* Color swatch */}
              <div
                className="w-1 flex-shrink-0 rounded-full"
                style={{ backgroundColor: echo.color }}
              />

              {/* Card body */}
              <div className="flex-1 flex flex-col gap-3">
                <p className="font-serif text-base text-charcoal/80 leading-relaxed italic">
                  {echo.insight}
                </p>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[9px] text-charcoal/30 tracking-[0.3em] uppercase">
                    {echo.weather}
                  </span>
                  <span className="font-mono text-[9px] text-charcoal/20 tracking-[0.2em]">
                    {new Date(echo.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  {/* Whisper button — only for echoes with a known author who isn't us */}
                  {echo.authorId && !isOwn && (
                    <button
                      onClick={() =>
                        setWhisper(
                          isWhispering ? null : { echoId: echo.id, content: '', status: 'idle' },
                        )
                      }
                      className="ml-auto flex items-center gap-1.5 font-mono text-[9px]
                                 text-charcoal/30 hover:text-charcoal/70 tracking-[0.25em]
                                 uppercase transition-colors duration-200"
                      title="Send a whisper"
                    >
                      <Mic size={10} strokeWidth={1.5} />
                      Whisper
                    </button>
                  )}
                </div>

                {/* Inline whisper input */}
                <AnimatePresence>
                  {isWhispering && (
                    <motion.div
                      key="whisper-input"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      {whisper.status === 'sent' ? (
                        <p
                          className="font-mono text-[10px] text-charcoal/40 tracking-[0.25em]
                                      italic py-2"
                        >
                          Whisper sent into the void.
                        </p>
                      ) : (
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Your whisper…"
                            value={whisper.content}
                            onChange={(e) =>
                              setWhisper((w) => (w ? { ...w, content: e.target.value } : w))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') sendWhisper()
                            }}
                            disabled={whisper.status === 'sending'}
                            className="flex-1 bg-transparent border-b border-sage/40 focus:border-charcoal/40
                                       font-serif text-sm text-charcoal/70 placeholder:text-charcoal/25
                                       outline-none py-1 transition-colors duration-200"
                          />
                          <button
                            onClick={sendWhisper}
                            disabled={!whisper.content.trim() || whisper.status === 'sending'}
                            className="font-mono text-[9px] tracking-[0.25em] uppercase
                                       text-charcoal/40 hover:text-charcoal/80 disabled:opacity-30
                                       transition-colors duration-200"
                          >
                            {whisper.status === 'sending' ? '…' : 'Send'}
                          </button>
                          {whisper.status === 'error' && (
                            <span className="font-mono text-[9px] text-charcoal/40">
                              Failed. Try again.
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
