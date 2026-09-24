// Deterministic, dependency-free slugify — good enough for topic names,
// which are short, mostly-ASCII, and don't need full Unicode transliteration.
export const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
