import {
  HOMEPAGE_POSTER_BRIEFS,
  HOMEPAGE_POSTER_FALLBACK_MODEL,
  HOMEPAGE_POSTER_PRIMARY_MODEL,
} from '@/lib/homepagePosterBriefs'

describe('homepage poster briefs', () => {
  it('defines six curated poster concepts', () => {
    expect(HOMEPAGE_POSTER_BRIEFS).toHaveLength(6)
  })

  it('uses unique slugs and preserves prompt medium rules', () => {
    const slugs = new Set(HOMEPAGE_POSTER_BRIEFS.map((brief) => brief.slug))
    expect(slugs.size).toBe(HOMEPAGE_POSTER_BRIEFS.length)

    for (const brief of HOMEPAGE_POSTER_BRIEFS) {
      expect(brief.prompt).toContain('2:3 portrait')
      expect(brief.prompt).toContain('Preserve the intended source-medium logic exactly')
    }
  })

  it('targets the latest fast Gemini image model with a stable fallback', () => {
    expect(HOMEPAGE_POSTER_PRIMARY_MODEL).toBe('gemini-3.1-flash-image-preview')
    expect(HOMEPAGE_POSTER_FALLBACK_MODEL).toBe('gemini-2.5-flash-image')
  })
})
