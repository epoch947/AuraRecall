import 'server-only'

import type { GenerateEchoRequest, GeneratedEcho } from '@/features/journal/contracts'
import { generatedEchoSchema } from '@/features/journal/contracts'
import { getOpenAIClient } from '@/server/ai/client'
import { ECHO_SYSTEM_PROMPT } from '@/server/ai/prompts'
import { createPublicEcho } from '@/server/db/repositories/publicEchoRepository'

const MOCK_INSIGHTS = [
  "If you didn't have to carry this weight tomorrow, what would you pick up instead?",
  'What part of today are you most reluctant to let go of — and why?',
  'If this feeling had a color no one has named yet, what would you call it?',
  'What would you tell a close friend who felt exactly as you do right now?',
  "Which of today's moments asked something of you that you weren't ready to give?",
  "If this heaviness were pointing somewhere — where do you think it's pointing?",
]

export interface EchoGenerationResult {
  imageUrl: string | null
  insight: string
  semanticColor: string | null
}

export function createMockEcho(): EchoGenerationResult {
  return {
    imageUrl: '/assets/4_1_runtime_cover_mock.jpg',
    insight: MOCK_INSIGHTS[Math.floor(Math.random() * MOCK_INSIGHTS.length)],
    semanticColor: null,
  }
}

export async function generateEcho(
  input: GenerateEchoRequest,
): Promise<{ result: EchoGenerationResult; generated: GeneratedEcho }> {
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ECHO_SYSTEM_PROMPT },
      { role: 'user', content: `Diary Entry: "${input.moodText}"\nWeather: "${input.weather}"` },
    ],
  })

  const generated = generatedEchoSchema.parse(
    JSON.parse(completion.choices[0].message.content ?? '{}'),
  )

  let imageUrl: string | null = null
  try {
    const imagePrompt =
      `A wide cinematic landscape representing the feeling of ${generated.keyword}. ` +
      `The dominant color scheme must be ${generated.semanticColor} tones with soft, misty lighting. ` +
      'Minimalist composition, deep depth of field, Wabi-sabi aesthetic, 2700K warm glow, ' +
      'high-end fine art photography. No text. No people. No logos.'

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1792x1024',
      quality: 'standard',
      n: 1,
    })
    imageUrl = image.data?.[0]?.url ?? null
  } catch (error) {
    console.error('[generate-echo] DALL-E 3 failed:', error)
    imageUrl = '/assets/4_1_runtime_cover_mock.jpg'
  }

  return {
    generated,
    result: {
      imageUrl,
      insight: generated.socraticQuestion,
      semanticColor: generated.semanticColor,
    },
  }
}

export async function persistPublicEcho(
  input: GenerateEchoRequest,
  generated: GeneratedEcho,
): Promise<void> {
  const embedding = await getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: input.moodText,
  })

  await createPublicEcho({
    color: generated.semanticColor,
    insight: generated.socraticQuestion,
    weather: input.weather,
    embedding: embedding.data[0].embedding,
    authorId: input.userId ?? null,
  })
}
