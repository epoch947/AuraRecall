import { notFound } from 'next/navigation'
import SlideCinema from '@/components/SlideCinema'

if (process.env.NODE_ENV !== 'development') notFound()

const MOCK_ECHO = {
  imageUrl: null,
  insight: "If you didn't have to carry this weight tomorrow, what would you pick up instead?",
  originalText:
    'Today felt heavy but strangely beautiful. Like rain on warm pavement — the smell of something old being washed clean.',
  weather: 'Soft Autumn Rain',
  semanticColor: 'hsl(210, 22%, 63%)',
  date: '23 March 2026',
}

export default function DebugPage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <SlideCinema echoData={MOCK_ECHO} initialSlide={1} />
    </div>
  )
}
