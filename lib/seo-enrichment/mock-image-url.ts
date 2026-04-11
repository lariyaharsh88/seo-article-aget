/** Placeholder image when Gemini (for prompts) is not configured or Pollinations URL failed. */
export function mockSectionImageUrl(sectionTitle: string, index: number): string {
  const label = encodeURIComponent(sectionTitle.slice(0, 42) || `Section ${index + 1}`);
  return `https://placehold.co/1200x675/0c1824/f59e0b/png?text=${label}&font=montserrat`;
}
