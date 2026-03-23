import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RitualPhase =
  | 'ENTRY'
  | 'ZEN_TIMER'
  | 'SAMPLING'
  | 'VIZ_LAB'
  | 'CINEMA'
  | 'ARCHIVE_GALLERY'

export interface WeatherData {
  description: string
  code: string
}

export interface EchoData {
  imageUrl: string | null
  insight: string
}

export interface EchoRecord {
  id: string
  createdAt: string
  originalText: string
  semanticColor: string
  weather: string
  imageUrl: string | null
  insight: string
}

interface RitualState {
  phase: RitualPhase
  moodText: string
  moodColor: string
  weatherData: WeatherData | null
  echoData: EchoData | null
  zenCompleted: boolean
  pastEchoes: EchoRecord[]

  advanceTo: (phase: RitualPhase) => void
  setMoodText: (text: string) => void
  setMoodColor: (color: string) => void
  setWeatherData: (data: WeatherData) => void
  setEchoData: (data: EchoData) => void
  markZenCompleted: () => void
  resetRitual: () => void
  saveAndReset: () => void
  viewArchive: () => void
}

const initialState = {
  phase: 'ENTRY' as RitualPhase,
  moodText: '',
  moodColor: 'hsl(43, 33%, 92%)',
  weatherData: null,
  echoData: null,
  zenCompleted: false,
}

export const useRitualStore = create<RitualState>()(
  persist(
    (set) => ({
      ...initialState,
      pastEchoes: [],

      advanceTo:        (phase)       => set({ phase }),
      setMoodText:      (moodText)    => set({ moodText }),
      setMoodColor:     (moodColor)   => set({ moodColor }),
      setWeatherData:   (weatherData) => set({ weatherData }),
      setEchoData:      (echoData)    => set({ echoData }),
      markZenCompleted: ()            => set({ zenCompleted: true }),
      resetRitual:      ()            => set(initialState),

      viewArchive:  ()            => set({ phase: 'ARCHIVE_GALLERY' }),

      saveAndReset: () =>
        set((state) => {
          const newPastEchoes = state.echoData
            ? [
                ...state.pastEchoes,
                {
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  originalText: state.moodText,
                  semanticColor: state.moodColor,
                  weather: state.weatherData?.description ?? 'Unknown Skies',
                  imageUrl: state.echoData.imageUrl,
                  insight: state.echoData.insight,
                },
              ]
            : state.pastEchoes
          return { ...initialState, pastEchoes: newPastEchoes }
        }),
    }),
    {
      name: 'aura-recall-echoes',
      partialize: (state) => ({ pastEchoes: state.pastEchoes }),
    }
  )
)
