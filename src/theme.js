/**
 * Cartwheel Arts brand tokens — edit hex values and font stacks here to refresh
 * the whole site without hunting through components. Loads Google Fonts in index.html
 * if you switch to custom families (e.g. Fraunces, Nunito).
 */
export const brandTokens = {
  canvas: '#faf8f5',
  ink: '#1c1917',
  accent: '#c45c3e',
  accentMuted: '#e8b4a4',
  muted: '#78716c',
  border: '#e7e5e4',

  /** Body copy */
  fontSans:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  /** Headings — pair with a <link> to Google Fonts if you use a named family */
  fontHeading: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
}

/**
 * Pushes token values onto :root as CSS variables consumed by Tailwind @theme.
 */
export function applyBrandTokens() {
  try {
    const root = document.documentElement
    root.style.setProperty('--ca-canvas', brandTokens.canvas)
    root.style.setProperty('--ca-ink', brandTokens.ink)
    root.style.setProperty('--ca-accent', brandTokens.accent)
    root.style.setProperty('--ca-accent-muted', brandTokens.accentMuted)
    root.style.setProperty('--ca-muted', brandTokens.muted)
    root.style.setProperty('--ca-border', brandTokens.border)
    root.style.setProperty('--ca-font-sans', brandTokens.fontSans)
    root.style.setProperty('--ca-font-heading', brandTokens.fontHeading)
  } catch (err) {
    console.error('applyBrandTokens failed', err)
  }
}
