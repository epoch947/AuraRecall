import { NextResponse } from 'next/server'

const MOCK_INSIGHTS = [
  "If you didn't have to carry this weight tomorrow, what would you pick up instead?",
  "What part of today are you most reluctant to let go of — and why?",
  "If this feeling had a color no one has named yet, what would you call it?",
  "What would you tell a close friend who felt exactly as you do right now?",
  "Which of today's moments asked something of you that you weren't ready to give?",
  "If this heaviness were pointing somewhere — where do you think it's pointing?",
]

export async function GET() {
  const useMock = process.env.USE_MOCK_API === 'true'

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 4000))

    const insight = MOCK_INSIGHTS[Math.floor(Math.random() * MOCK_INSIGHTS.length)]

    return NextResponse.json({
      imageUrl: '/assets/4_1_runtime_cover_mock.jpg',
      insight,
    })
  }

  // Production path — integrate Higgsfield + LLM here
  return NextResponse.json({ imageUrl: null, insight: 'No echo generated.' })
}
