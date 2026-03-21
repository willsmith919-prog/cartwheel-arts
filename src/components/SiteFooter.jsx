/**
 * Simple footer with contact placeholder; replace with real details or CMS later.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-border bg-stone-100/80 py-8 text-center text-sm text-muted">
      <p className="font-heading text-ink">
        Cartwheel Arts · cartwheelarts.org
      </p>
      <p className="mt-2">© {year} Cartwheel Arts. All rights reserved.</p>
    </footer>
  )
}
