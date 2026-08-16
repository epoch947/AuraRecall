import { describe, expect, it } from 'vitest'

import { describeWeather } from './weather'

describe('describeWeather', () => {
  it.each([
    [0, { description: 'Clear Sky', code: 'sun' }],
    [3, { description: 'Grey Overcast', code: 'cloud' }],
    [48, { description: 'Still Morning Mist', code: 'mist' }],
    [65, { description: 'Heavy Rain', code: 'rain' }],
    [77, { description: 'Pale Winter Snow', code: 'snow' }],
    [95, { description: 'Restless Storm', code: 'storm' }],
  ])('maps WMO code %i', (code, expected) => {
    expect(describeWeather(code)).toEqual(expected)
  })
})
