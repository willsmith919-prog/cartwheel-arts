/**
 * Placeholder for posts/articles; planned to load from Firestore or a headless CMS.
 */
export default function BlogPage() {
  return (
    <div className="text-left">
      <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">
        News &amp; studio updates
      </h1>
      <p className="mt-4 text-muted">
        Posts will appear here once Firestore (or your chosen CMS) is connected.
        For now, share important dates on the Classes page or your existing
        channels.
      </p>
    </div>
  )
}
