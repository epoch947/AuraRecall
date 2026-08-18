import { z } from 'zod'

const semanticColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)

export const weatherCodeSchema = z.enum([
  'sun',
  'cloud',
  'mist',
  'rain',
  'snow',
  'storm',
  'unknown',
])

export const weatherLookupRequestSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
})

export const weatherDataSchema = z.object({
  description: z.string().trim().min(1).max(100),
  code: weatherCodeSchema,
  temperatureC: z.number().finite().min(-100).max(70),
  apparentTemperatureC: z.number().finite().min(-120).max(80),
  windSpeedKmh: z.number().finite().min(0).max(500),
  isDay: z.boolean(),
  observedAt: z.string().datetime({ offset: true }),
})

export const weatherLookupErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal('WEATHER_UNAVAILABLE'),
    message: z.string().trim().min(1).max(200),
  }),
})

export const generateEchoRequestSchema = z.object({
  moodText: z.string().trim().min(10).max(5000),
  weather: z.string().trim().min(1).max(200),
  isPublic: z.boolean().optional().default(false),
})

export const generatedEchoSchema = z.object({
  semanticColor: semanticColorSchema,
  socraticQuestion: z.string().trim().min(1).max(500),
  keyword: z.string().trim().min(1).max(80),
})

export const echoGenerationResponseSchema = z.object({
  imageUrl: z.string().min(1).nullable(),
  insight: z.string().trim().min(1).max(500),
  semanticColor: semanticColorSchema.nullable(),
})

export const echoGenerationErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal('AI_GENERATION_UNAVAILABLE'),
    message: z.string().trim().min(1).max(300),
  }),
})

export const echoSummarySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  color: z.string().trim().min(1).max(100),
  weather: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(100),
})

export const generatePatternsRequestSchema = z.object({
  echoes: z.array(echoSummarySchema).min(1).max(100),
})

export const patternSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
})

export const patternsResponseSchema = z.object({
  patterns: z.array(patternSchema).length(3),
})

export interface EchoData {
  imageUrl: string | null
  insight: string
  semanticColor?: string | null
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

export type GenerateEchoRequest = z.infer<typeof generateEchoRequestSchema>
export type GeneratedEcho = z.infer<typeof generatedEchoSchema>
export type EchoGenerationResponse = z.infer<typeof echoGenerationResponseSchema>
export type EchoGenerationErrorResponse = z.infer<typeof echoGenerationErrorResponseSchema>
export type WeatherLookupRequest = z.infer<typeof weatherLookupRequestSchema>
export type WeatherData = z.infer<typeof weatherDataSchema>
export type WeatherLookupErrorResponse = z.infer<typeof weatherLookupErrorResponseSchema>
export type EchoSummary = z.infer<typeof echoSummarySchema>
export type Pattern = z.infer<typeof patternSchema>
