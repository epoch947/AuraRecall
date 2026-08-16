import { useEffect, useState } from 'react'

export function useTypewriter(text: string, speed = 40, active = true): string {
  const runKey = `${text}\u0000${speed}`
  const [frame, setFrame] = useState({ runKey: '', displayed: '' })

  useEffect(() => {
    if (!active) return

    let i = 0
    const timer = setInterval(() => {
      i++
      setFrame({ runKey, displayed: text.slice(0, i) })
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, active, speed, runKey])

  return active && frame.runKey === runKey ? frame.displayed : ''
}
