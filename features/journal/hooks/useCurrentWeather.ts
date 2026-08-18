'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { weatherDataSchema, weatherLookupErrorResponseSchema } from '@/features/journal/contracts'
import { roundWeatherCoordinate } from '@/features/journal/lib/weather'
import { useRitualStore } from '@/features/journal/store/useRitualStore'

export type WeatherLookupStatus =
  'idle' | 'locating' | 'fetching' | 'ready' | 'denied' | 'unsupported' | 'error'

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 600_000,
}

export function useCurrentWeather() {
  const weatherData = useRitualStore((state) => state.weatherData)
  const setWeatherData = useRitualStore((state) => state.setWeatherData)
  const [status, setStatus] = useState<WeatherLookupStatus>(weatherData ? 'ready' : 'idle')
  const [message, setMessage] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestSequenceRef = useRef(0)

  const requestWeather = useCallback(() => {
    const requestId = ++requestSequenceRef.current
    abortControllerRef.current?.abort()
    setMessage('')

    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      setMessage('This browser cannot share a current location. You can continue without weather.')
      return
    }

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (requestId !== requestSequenceRef.current) return

        const abortController = new AbortController()
        abortControllerRef.current = abortController
        setStatus('fetching')

        try {
          const response = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: roundWeatherCoordinate(position.coords.latitude),
              longitude: roundWeatherCoordinate(position.coords.longitude),
            }),
            signal: abortController.signal,
          })
          const payload: unknown = await response.json().catch(() => null)

          if (!response.ok) {
            const parsedError = weatherLookupErrorResponseSchema.safeParse(payload)
            throw new Error(
              parsedError.success
                ? parsedError.data.error.message
                : 'Local weather is unavailable right now. You can continue without it.',
            )
          }

          const parsedWeather = weatherDataSchema.safeParse(payload)
          if (!parsedWeather.success) {
            throw new Error('The weather service returned an incomplete reading.')
          }

          if (requestId !== requestSequenceRef.current) return
          setWeatherData(parsedWeather.data)
          setStatus('ready')
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return
          if (requestId !== requestSequenceRef.current) return

          setStatus('error')
          setMessage(
            error instanceof Error
              ? error.message
              : 'Local weather is unavailable right now. You can continue without it.',
          )
        }
      },
      (error) => {
        if (requestId !== requestSequenceRef.current) return

        if (error.code === 1) {
          setStatus('denied')
          setMessage('Location was not shared. You can continue without weather or try again.')
          return
        }

        setStatus('error')
        setMessage(
          error.code === 3
            ? 'Finding your location took too long. You can continue without weather or try again.'
            : 'Your current location could not be determined. You can continue without weather.',
        )
      },
      GEOLOCATION_OPTIONS,
    )
  }, [setWeatherData])

  const removeWeather = useCallback(() => {
    ++requestSequenceRef.current
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setWeatherData(null)
    setMessage('')
    setStatus('idle')
  }, [setWeatherData])

  useEffect(
    () => () => {
      ++requestSequenceRef.current
      abortControllerRef.current?.abort()
    },
    [],
  )

  return {
    weatherData,
    status,
    message,
    requestWeather,
    removeWeather,
    isLoading: status === 'locating' || status === 'fetching',
  }
}
