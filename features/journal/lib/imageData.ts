export type GeneratedImageFormat = 'jpeg' | 'png' | 'webp'

const IMAGE_MEDIA_TYPES: Record<GeneratedImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function toImageDataUrl(encodedImage: string, format: GeneratedImageFormat): string {
  const normalizedImage = encodedImage.trim()
  if (!normalizedImage) {
    throw new Error('OpenAI image generation completed without image data')
  }

  return `data:${IMAGE_MEDIA_TYPES[format]};base64,${normalizedImage}`
}

export function isInlineImageDataUrl(imageUrl: string | null): boolean {
  return imageUrl?.startsWith('data:image/') ?? false
}
