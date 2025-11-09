import { cn, formatDate } from './utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
    expect(result).toContain('base-class')
    expect(result).toContain('conditional-class')
    expect(result).not.toContain('hidden-class')
  })

  it('merges tailwind classes correctly', () => {
    const result = cn('px-2', 'px-4')
    // twMerge should keep the last occurrence
    expect(result).toBe('px-4')
  })

  it('handles arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
    expect(result).toContain('class3')
  })

  it('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'other')
    expect(result).toContain('base')
    expect(result).toContain('other')
  })
})

describe('formatDate utility', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    expect(result).toMatch(/Jan 1[45], 2024/)
  })

  it('formats date string correctly', () => {
    const result = formatDate('2024-03-20')
    expect(result).toMatch(/Mar (19|20), 2024/)
  })

  it('handles different date formats', () => {
    const result = formatDate('2024-12-25T10:30:00')
    expect(result).toMatch(/Dec 2[45], 2024/)
  })

  it('returns valid date format for timestamps', () => {
    const timestamp = new Date('2024-06-15').getTime()
    const result = formatDate(new Date(timestamp))
    expect(result).toMatch(/Jun 1[45], 2024/)
  })
})
