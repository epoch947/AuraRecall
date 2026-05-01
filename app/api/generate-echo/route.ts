import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INSIGHTS = [
  "If you didn't have to carry this weight tomorrow, what would you pick up instead?",
  "What part of today are you most reluctant to let go of — and why?",
  "If this feeling had a color no one has named yet, what would you call it?",
  "What would you tell a close friend who felt exactly as you do right now?",
  "Which of today's moments asked something of you that you weren't ready to give?",
  "If this heaviness were pointing somewhere — where do you think it's pointing?",
]

function mockResponse() {
  return {
    imageUrl: '/assets/4_1_runtime_cover_mock.jpg',
    insight: MOCK_INSIGHTS[Math.floor(Math.random() * MOCK_INSIGHTS.length)],
    semanticColor: null,
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── Cost-saving gatekeeper ─────────────────────────────────────────────────
  if (process.env.USE_MOCK_API === 'true') {
    await new Promise((r) => setTimeout(r, 4000))
    return NextResponse.json(mockResponse())
  }

  const { moodText, weather } = (await req.json()) as {
    moodText: string
    weather: string
  }

  // ── Stage 1: OpenAI — must succeed, else fall back to mock ─────────────────
  let llm: { semanticColor: string; socraticQuestion: string; keyword: string }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a Zen master and Japandi aesthetic designer. Analyze the user's diary entry and weather context.
You must respond ONLY with a JSON object containing exactly these three string keys:
- "semanticColor": A hex code representing the emotional tone (e.g., "#B9B99D" for calm, "#D1D5DB" for heavy). Keep it muted and Japandi style.
- "socraticQuestion": A single, profound, short philosophical question reflecting on their text. Never give advice, only ask.
- "keyword": A 1–2 word atmospheric descriptor.`,
        },
        {
          role: 'user',
          content: `Diary Entry: "${moodText}"\nWeather: "${weather}"`,
        },
      ],
    })

    llm = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (err) {
    console.error('[generate-echo] OpenAI call failed:', err)
    return NextResponse.json(mockResponse())
  }

  // ── Stage 2: DALL-E 3 — failure only nulls imageUrl, never discards llm ────
  let imageUrl: string | null = null

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const imagePrompt =
      `A wide cinematic landscape representing the feeling of ${llm.keyword}. ` +
      `The dominant color scheme must be ${llm.semanticColor} tones with soft, misty lighting. ` +
      `Minimalist composition, deep depth of field, Wabi-sabi aesthetic, 2700K warm glow, ` +
      `high-end fine art photography. No text. No people. No logos.`

    const imgRes = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1792x1024',
      quality: 'standard',
      n: 1,
    })

    imageUrl = imgRes.data?.[0]?.url ?? null
  } catch (err) {
    console.error('[generate-echo] DALL-E 3 failed:', err)
    imageUrl = '/assets/4_1_runtime_cover_mock.jpg'
  }

  return NextResponse.json({
    imageUrl,
    insight: llm.socraticQuestion,
    semanticColor: llm.semanticColor,
  })
}
