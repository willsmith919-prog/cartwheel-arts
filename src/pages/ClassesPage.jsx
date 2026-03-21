/**
 * Class schedule and registration entry point; Stripe Checkout + Cloud Functions come next.
 */
export default function ClassesPage() {
  return (
    <div className="text-left">
      <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">
        Class schedule
      </h1>
      <p className="mt-4 text-muted">
        Upcoming sessions, open seats, and secure registration with payment will
        be wired to Firestore and Stripe Checkout (with confirmation via
        webhook — never trust the browser alone).
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-white/60 p-6 text-sm text-muted">
        <p className="font-medium text-ink">Next build steps</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Firestore collections for sessions and registrations</li>
          <li>Cloud Function: create Stripe Checkout session</li>
          <li>Cloud Function: Stripe webhook to finalize registration</li>
          <li>Resend for confirmation emails to families</li>
        </ul>
      </div>
    </div>
  )
}
