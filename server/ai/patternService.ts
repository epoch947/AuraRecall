import 'server-only'

import type { EchoSummary, Pattern } from '@/features/journal/contracts'
import { patternsResponseSchema } from '@/features/journal/contracts'
import { getOpenAIClient } from '@/server/ai/client'
import { PATTERN_SYSTEM_PROMPT } from '@/server/ai/prompts'

const MOCK_PATTERNS: Pattern[] = [
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
]

export function createMockPatterns(): { patterns: Pattern[] } {
  return { patterns: MOCK_PATTERNS }
}

export async function generatePatterns(echoes: EchoSummary[]): Promise<{ patterns: Pattern[] }> {
  const userContent = echoes
    .map(
      (echo, index) =>
        `Entry ${index + 1} — Date: ${echo.date} | Weather: ${echo.weather} | Color: ${echo.color}\n"${echo.text}"`,
    )
    .join('\n\n')

  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PATTERN_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  })

  return patternsResponseSchema.parse(JSON.parse(completion.choices[0].message.content ?? '{}'))
}
