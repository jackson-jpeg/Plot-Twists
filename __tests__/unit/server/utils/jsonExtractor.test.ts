import { extractJSON } from '../../../../server/utils/jsonExtractor'

describe('extractJSON', () => {
  it('should extract clean JSON object', () => {
    const input = '{"title":"Test","lines":[]}'
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'Test', lines: [] })
  })

  it('should extract JSON from markdown fences', () => {
    const input = '```json\n{"title":"Test"}\n```'
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'Test' })
  })

  it('should extract JSON from markdown fences without language tag', () => {
    const input = '```\n{"title":"Test"}\n```'
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'Test' })
  })

  it('should extract JSON with preamble text', () => {
    const input = 'Here is the script:\n\n{"title":"Test","lines":[]}'
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'Test', lines: [] })
  })

  it('should extract JSON with trailing text', () => {
    const input = '{"title":"Test"}\n\nI hope you enjoyed this script!'
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'Test' })
  })

  it('should handle nested brackets correctly', () => {
    const input = '{"title":"Test","data":{"nested":{"deep":true}}}'
    expect(JSON.parse(extractJSON(input))).toEqual({
      title: 'Test',
      data: { nested: { deep: true } }
    })
  })

  it('should handle nested arrays correctly', () => {
    const input = '{"lines":[{"speaker":"A"},{"speaker":"B"}]}'
    const result = JSON.parse(extractJSON(input))
    expect(result.lines).toHaveLength(2)
    expect(result.lines[0].speaker).toBe('A')
  })

  it('should handle strings containing braces', () => {
    const input = '{"text":"He said {hello} to her"}'
    expect(JSON.parse(extractJSON(input))).toEqual({ text: 'He said {hello} to her' })
  })

  it('should handle strings containing escaped quotes', () => {
    const input = '{"text":"He said \\"hello\\" to her"}'
    expect(JSON.parse(extractJSON(input))).toEqual({ text: 'He said "hello" to her' })
  })

  it('should extract JSON array', () => {
    const input = '[{"id":1},{"id":2}]'
    const result = JSON.parse(extractJSON(input))
    expect(result).toHaveLength(2)
  })

  it('should prefer the first bracket character found', () => {
    const input = 'Some text [1, 2, 3] more text'
    expect(JSON.parse(extractJSON(input))).toEqual([1, 2, 3])
  })

  it('should handle object before array when both present', () => {
    const input = '{"title":"Test"} [1,2,3]'
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'Test' })
  })

  it('should return original text when no JSON found', () => {
    const input = 'No JSON here at all'
    expect(extractJSON(input)).toBe('No JSON here at all')
  })

  it('should handle complex real-world script JSON', () => {
    const input = `Here's the comedy script:

\`\`\`json
{
  "title": "The Codfather",
  "synopsis": "A pirate must navigate IKEA",
  "lines": [
    {"speaker": "Captain", "text": "Where's the exit?", "mood": "confused"},
    {"speaker": "NARRATOR", "text": "There was no exit.", "mood": "neutral"}
  ]
}
\`\`\`

Hope you enjoy!`

    const result = JSON.parse(extractJSON(input))
    expect(result.title).toBe('The Codfather')
    expect(result.lines).toHaveLength(2)
  })
})
