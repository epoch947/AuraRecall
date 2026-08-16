import 'server-only'

import OpenAI from 'openai'

let openAIClient: OpenAI | undefined

export function getOpenAIClient(): OpenAI {
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openAIClient
}
