/**
 * Footer with real Cartwheel Arts contact details.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-border bg-stone-100/80 py-8 text-center text-sm text-muted">
      <p className="font-heading text-base text-ink">Cartwheel Arts</p>
      <p className="mt-2">
        <a
          href="mailto:katie@cartwheelarts.org"
          className="hover:text-ink transition-colors"
        >
          katie@cartwheelarts.org
        </a>
        {' · '}
        <a
          href="tel:+13852069407"
          className="hover:text-ink transition-colors"
        >
          (385) 206-9407
        </a>
      </p>
      <p className="mt-1">Kaysville, UT</p>
      <p className="mt-3 text-xs">© {year} Cartwheel Arts. All rights reserved.</p>
    </footer>
  )
}
