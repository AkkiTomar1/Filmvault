export function detectRegion(language: string = navigator.language): string {
  const segments = language.toUpperCase().split('-')
  let region: string | undefined
  for (let i = 1; i < segments.length; i += 1) {
    if (/^[A-Z]{2}$/.test(segments[i])) {
      region = segments[i]
    }
  }
  return region ?? 'US'
}