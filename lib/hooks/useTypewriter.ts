import { useState, useEffect } from 'react'

export function useTypewriter(text: string, speed = 40, active = true): string {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!active) {
      setDisplayed('')
      return
    }
    setDisplayed('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, active, speed])

  return displayed
}
