import { describe, expect, it } from 'vitest'

import { isInlineImageDataUrl, toImageDataUrl } from './imageData'

describe('image data helpers', () => {
  it('creates a WebP data URL from an OpenAI base64 payload', () => {
    expect(toImageDataUrl('  d2VicC1pbWFnZQ==  ', 'webp')).toBe(
      'data:image/webp;base64,d2VicC1pbWFnZQ==',
    )
  })

  it('rejects an empty image payload', () => {
    expect(() => toImageDataUrl('   ', 'webp')).toThrow(
      'OpenAI image generation completed without image data',
    )
  })

  it('distinguishes inline images from persistable URLs', () => {
    expect(isInlineImageDataUrl('data:image/webp;base64,d2VicA==')).toBe(true)
    expect(isInlineImageDataUrl('https://example.com/image.webp')).toBe(false)
    expect(isInlineImageDataUrl(null)).toBe(false)
  })
})
