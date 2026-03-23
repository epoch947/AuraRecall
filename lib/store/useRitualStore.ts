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
  injectDummyData: () => void
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

      injectDummyData: () =>
        set((state) => {
          const ago = (days: number) =>
            new Date(Date.now() - days * 86_400_000).toISOString()

          const records: EchoRecord[] = ([
            { id: 'dummy-1',  createdAt: ago(1),  semanticColor: 'hsl(210, 22%, 63%)', weather: 'Soft Autumn Rain',  originalText: 'Today felt heavy but strangely beautiful.',      insight: "If you didn't have to carry this weight tomorrow, what would you pick up instead?" },
            { id: 'dummy-2',  createdAt: ago(2),  semanticColor: 'hsl(185, 20%, 74%)', weather: 'Clear Morning',     originalText: 'A quiet stillness settled over everything.',      insight: 'What part of today are you most reluctant to let go of?' },
            { id: 'dummy-3',  createdAt: ago(3),  semanticColor: 'hsl(30, 40%, 75%)',  weather: 'Warm Afternoon',   originalText: 'Grateful for small things today.',                insight: 'If this feeling had a color no one has named yet, what would you call it?' },
            { id: 'dummy-4',  createdAt: ago(4),  semanticColor: 'hsl(260, 20%, 50%)', weather: 'Overcast',         originalText: 'Something heavy I cannot name.',                 insight: "Which of today's moments asked something of you that you weren't ready to give?" },
            { id: 'dummy-5',  createdAt: ago(6),  semanticColor: 'hsl(45, 50%, 68%)',  weather: 'Restless Wind',    originalText: "Can't sit still. Mind racing ahead.",            insight: 'What would you tell a close friend who felt exactly as you do right now?' },
            { id: 'dummy-6',  createdAt: ago(7),  semanticColor: 'hsl(220, 25%, 60%)', weather: 'Grey Skies',       originalText: 'Lonely in a room full of people.',              insight: 'If this heaviness were pointing somewhere — where?' },
            { id: 'dummy-7',  createdAt: ago(9),  semanticColor: 'hsl(42, 45%, 74%)',  weather: 'Bright Midday',    originalText: 'A rare kind of happiness today.',                insight: 'What part of today are you most reluctant to let go of?' },
            { id: 'dummy-8',  createdAt: ago(11), semanticColor: 'hsl(195, 14%, 73%)', weather: 'Soft Cloud Cover', originalText: 'Everything felt quiet inside.',                   insight: 'If this feeling had a color no one has named yet, what would you call it?' },
            { id: 'dummy-9',  createdAt: ago(13), semanticColor: 'hsl(250, 15%, 55%)', weather: 'Damp Evening',     originalText: 'Tired. Not sleepy — just worn.',                 insight: "What would you pick up instead of what you're carrying?" },
            { id: 'dummy-10', createdAt: ago(15), semanticColor: 'hsl(350, 35%, 72%)', weather: 'Clear Night',      originalText: 'Thinking of people I love far away.',           insight: 'Which moment today asked more of you than you had?' },
            { id: 'dummy-11', createdAt: ago(17), semanticColor: 'hsl(180, 20%, 75%)', weather: 'Misty Dawn',       originalText: 'Peace arrived without warning this morning.',    insight: 'If this were pointing somewhere — where do you think it points?' },
            { id: 'dummy-12', createdAt: ago(19), semanticColor: 'hsl(55, 48%, 70%)',  weather: 'Bright Morning',   originalText: 'Something shifted. I feel more alive.',          insight: 'What would you tell a close friend feeling exactly this?' },
            { id: 'dummy-13', createdAt: ago(21), semanticColor: 'hsl(265, 16%, 48%)', weather: 'Stormy Night',     originalText: "Dark thoughts that I don't fully trust.",        insight: "If you didn't have to carry this weight tomorrow, what would you pick up?" },
            { id: 'dummy-14', createdAt: ago(24), semanticColor: 'hsl(35, 38%, 74%)',  weather: 'Autumn Afternoon', originalText: 'A soft warmth. Like remembering something good.', insight: 'What part of today are you most reluctant to release?' },
            { id: 'dummy-15', createdAt: ago(27), semanticColor: 'hsl(215, 12%, 65%)', weather: 'Foggy Morning',    originalText: 'Nothing extraordinary. A good kind of grey.',    insight: 'If this feeling had a color, what would you call it?' },
            { id: 'dummy-16', createdAt: ago(30), semanticColor: 'hsl(28, 36%, 73%)',  weather: 'Cozy Evening',     originalText: 'Sat by the window for a long time. Just sat.',   insight: "Which of today's moments asked something you weren't ready to give?" },
          ] as Omit<EchoRecord, 'imageUrl'>[]).map((r) => ({ ...r, imageUrl: null }))

          return { pastEchoes: [...state.pastEchoes, ...records] }
        }),

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
