/**
 * Landing copy for the studio; replace with richer content or Firestore-driven blocks later.
 */
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Art classes &amp; emotional processing for kids
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          A calm, creative space where children explore materials, build
          confidence, and process feelings through art. Registration and
          schedules will live here soon.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/classes"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          View class schedule
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-stone-50"
        >
          Read updates
        </Link>
      </div>
    </div>
  )
}
