'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { computeTopography, type TopographyPoint } from '@/lib/topographyEngine'
import type { EchoRecord } from '@/lib/store/useRitualStore'

interface Props {
  echoes: EchoRecord[]
}

function buildPath(points: TopographyPoint[], W: number, H: number): string {
  if (points.length < 2) return ''
  const pad = 60
  const toSVG = (p: TopographyPoint) => ({
    x: pad + p.x * (W - pad * 2),
    y: pad + p.y * (H - pad * 2),
  })
  const coords = points.map(toSVG)
  return coords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = coords[i - 1]
    const cpx = (prev.x + pt.x) / 2
    const cpy = (prev.y + pt.y) / 2
    return `${acc} Q ${prev.x} ${prev.y} ${cpx} ${cpy}`
  }, '')
}

export default function TopographyMap({ echoes }: Props) {
  const [points, setPoints] = useState<TopographyPoint[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (echoes.length < 2) { setPoints([]); return }
    let cancelled = false
    computeTopography(echoes).then((pts) => {
      if (!cancelled) setPoints(pts)
    })
    return () => { cancelled = true }
  }, [echoes])

  const hoveredPoint = points.find((p) => p.id === hoveredId) ?? null
  const W = 1000
  const H = 1000
  const pad = 60
  const toSVG = (p: TopographyPoint) => ({
    x: pad + p.x * (W - pad * 2),
    y: pad + p.y * (H - pad * 2),
  })
  const pathD = buildPath(points, W, H)

  if (echoes.length < 2) {
    return (
      <div className="flex items-center justify-center h-full opacity-30 pt-32">
        <p className="font-serif text-sm text-charcoal italic tracking-wide">
          Add more echoes to reveal your topography.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        aria-label="Aura Topography Map"
      >
        <defs>
          <filter id="dot-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Trajectory path — chronological, subtle */}
        {pathD && (
          <motion.path
            d={pathD}
            fill="none"
            stroke="#333333"
            strokeWidth={1.5}
            strokeOpacity={0.12}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.4, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
          />
        )}

        {/* Dots */}
        {points.map((pt, i) => {
          const { x, y } = toSVG(pt)
          const isHovered = pt.id === hoveredId
          return (
            <motion.circle
              key={pt.id}
              cx={x}
              cy={y}
              r={isHovered ? 14 : 10}
              fill={pt.color}
              filter="url(#dot-glow)"
              style={{ cursor: 'default', opacity: isHovered ? 1 : 0.75 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isHovered ? 1 : 0.75 }}
              transition={{
                delay: 0.1 + i * 0.04,
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              onMouseEnter={() => setHoveredId(pt.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          )
        })}
      </svg>

      {/* Hover tooltip — fixed bottom panel */}
      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            key={hoveredPoint.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 inset-x-0 z-30 bg-oatmeal/95 backdrop-blur-sm
                       border-t border-sage/20 px-8 py-5 flex items-start gap-6"
          >
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5"
              style={{ backgroundColor: hoveredPoint.color }}
            />
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[10px] text-charcoal/50 tracking-[0.25em] uppercase">
                {new Date(hoveredPoint.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="font-serif text-sm text-charcoal/70 leading-relaxed italic max-w-lg">
                {hoveredPoint.insight}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
