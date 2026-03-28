/**
 * RegistrationSuccessPage — shown after a successful registration submission.
 * Reads child name and parent email from URL params.
 */
import { Link, useParams, useSearchParams } from 'react-router-dom'

export default function RegistrationSuccessPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const childName = searchParams.get('name') ?? 'your child'
  const parentEmail = searchParams.get('parent') ?? ''

  return (
    <div className="max-w-xl mx-auto text-center space-y-6 py-12">

      <div className="text-6xl">🎨</div>

      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink mb-3">
          You're registered!
        </h1>
        <p className="text-muted leading-relaxed">
          <strong style={{ color: 'var(--ca-ink)' }}>{childName}</strong> is
          signed up. {parentEmail && (
            <>A confirmation has been sent to <strong style={{ color: 'var(--ca-ink)' }}>{parentEmail}</strong>.</>
          )}
        </p>
      </div>

      <div
        className="rounded-xl px-6 py-5 text-left space-y-2"
        style={{ backgroundColor: '#fdf6f3', border: '1px solid var(--ca-border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>What happens next</p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--ca-muted)' }}>
          <li>📧 You'll receive class reminders before each session</li>
          <li>💰 Payment will be collected at the door</li>
          <li>❓ Questions? Email <a href="mailto:katie@cartwheelarts.org" style={{ color: 'var(--ca-accent)' }}>katie@cartwheelarts.org</a></li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/classes"
          className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
          style={{ backgroundColor: 'var(--ca-accent)', color: '#ffffff' }}
        >
          Browse more classes
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition"
          style={{ border: '1px solid var(--ca-border)', color: 'var(--ca-ink)', backgroundColor: '#ffffff' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
