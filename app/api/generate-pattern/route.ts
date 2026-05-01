import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EchoSummary {
  text: string
  color: string
  weather: string
  date: string
}

interface Pattern {
  title: string
  description: string
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a quiet, empathetic observer analyzing someone's private emotional journal.
You will receive a list of entries. Each has: text (their words), color (the emotional hue assigned to that day), weather (atmospheric conditions), and date.

Find exactly 3 patterns across these three lenses:
1. Word or entity ↔ color correlations: recurring words/themes that coincide with specific color tones
2. Weather ↔ mood correlations: how atmospheric conditions seem to shape or mirror emotional states
3. Emotional rhythms over time: cycles, shifts, or progressions visible across the timeline

Respond ONLY with a JSON object in this exact shape:
{
  "patterns": [
    { "title": "2-3 poetic words", "description": "1-2 empathetic sentences in second person" },
    { "title": "2-3 poetic words", "description": "1-2 empathetic sentences in second person" },
    { "title": "2-3 poetic words", "description": "1-2 empathetic sentences in second person" }
  ]
}

Rules:
- Title: 2-3 words only, poetic, no punctuation, no verbs required
- Description: warm, empathetic, observational — never clinical or prescriptive
- Use "you" and "your" — speak directly to the person
- Do not invent patterns that are not present in the data`

// ─── Mock fallback ────────────────────────────────────────────────────────────

function mockPatterns(): { patterns: Pattern[] } {
  return {
    patterns: [
      {
        title: 'Quiet Before Rain',
        description:
          "Your words soften in the hours before weather changes — as if your body knows the sky's mood before the clouds arrive.",
      },
      {
        title: 'Sunday Amber Drift',
        description:
          "Warmth gathers in your entries at the week's edge. Something in you exhales on those days.",
      },
      {
        title: 'The Indigo Hours',
        description:
          'When the night deepens, so does your language. These are the entries where you seem most honestly yourself.',
      },
    ],
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (process.env.USE_MOCK_API === 'true') {
    await new Promise((r) => setTimeout(r, 2000))
    return NextResponse.json(mockPatterns())
  }

  const { echoes } = (await req.json()) as { echoes: EchoSummary[] }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const userContent = echoes
      .map(
        (e, i) =>
          `Entry ${i + 1} — Date: ${e.date} | Weather: ${e.weather} | Color: ${e.color}\n"${e.text}"`
      )
      .join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })

    const result = JSON.parse(
      completion.choices[0].message.content ?? '{}'
    ) as { patterns: Pattern[] }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[generate-pattern] OpenAI call failed:', err)
    return NextResponse.json({ error: 'Pattern recognition failed' }, { status: 500 })
  }
}
