/**
 * Gemini image-generation model selection.
 *
 * Lives here rather than beside any particular set of prompts so that no
 * content brief is load-bearing for the image pipeline. (It previously lived in
 * `homepagePosterBriefs.ts`, deleted in Chunk 4a — see AUDIT.md.)
 */

export const POSTER_IMAGE_PRIMARY_MODEL =
  process.env.GEMINI_POSTER_PRIMARY_MODEL || 'gemini-3.1-flash-image-preview'

export const POSTER_IMAGE_FALLBACK_MODEL =
  process.env.GEMINI_POSTER_FALLBACK_MODEL || 'gemini-2.5-flash-image'
