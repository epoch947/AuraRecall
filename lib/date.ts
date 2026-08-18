type DateInput = Date | string | number

const fullUtcDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const briefUtcDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value)
}

export function formatFullUtcDate(value: DateInput): string {
  return fullUtcDateFormatter.format(toDate(value))
}

export function formatBriefUtcDate(value: DateInput): string {
  return briefUtcDateFormatter.format(toDate(value))
}
