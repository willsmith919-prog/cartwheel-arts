/**
 * AdminAboutPage — Katie can edit her About Me content from the admin portal.
 * Content is stored as a single document in Firestore at settings/about.
 * The public HomePage reads directly from the hardcoded content for now —
 * this page lets Katie update it without touching code.
 */
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { getDb } from '../../firebase/client'

// Defined outside component to prevent focus loss on re-render
function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-sm font-medium"
        style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}
      >
        {label}
      </label>
      {hint && (
        <p className="text-xs" style={{ color: 'var(--ca-muted)' }}>{hint}</p>
      )}
      {children}
      {error && (
        <p className="text-xs" style={{ color: '#b91c1c' }}>{error}</p>
      )}
    </div>
  )
}

function inputStyle(hasError) {
  return {
    border: `1px solid ${hasError ? '#f87171' : 'var(--ca-border)'}`,
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontFamily: 'var(--ca-font-sans)',
    color: 'var(--ca-ink)',
    backgroundColor: '#ffffff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
}

const DEFAULT_FORM = {
  heroHeadline: 'Art, movement & emotional wellness for kids',
  heroSubtitle: 'In Cartwheel Arts, kids learn how to process big emotions in healthy ways — using nature-based art, movement, mindfulness, and play.',
  aboutTitle: 'What is Cartwheel Arts?',
  aboutBody: 'The more children can love and accept themselves, the healthier and more confident they will be as teens and adults. We teach kids that humans were designed to feel a full range of emotions and then let them go — it\'s all just a part of this life experience.\n\nEmotions come and go, and if we pause to acknowledge them and feel them in healthy ways, they can move through us more easily.',
  meetKatieTitle: 'Meet Katie',
  meetKatieBody: 'Hi! I\'m Katie Newbold Smith, founder of Cartwheel Arts. With my master\'s in Human Development & Social Policy and certifications in Intuitive Cranial Sacral Therapy and Quantum Human Design Family Coaching, I\'ve developed methods to help individuals and families live with more self-love and harmony.\n\nI\'m a mother to three spirited and creative daughters, wife to a very supportive husband, and owner of the cutest Havanese puppy.',
  email: 'katie@cartwheelarts.org',
  phone: '(385) 206-9407',
  location: 'Kaysville, UT',
}

export default function AdminAboutPage() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const db = getDb()
    if (!db) { setLoading(false); return }

    getDoc(doc(db, 'settings', 'about')).then((snap) => {
      if (snap.exists()) {
        setForm((prev) => ({ ...prev, ...snap.data() }))
      }
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load about content', err)
      setLoading(false)
    })
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSaved(false)
  }

  function validate() {
    const e = {}
    if (!form.heroHeadline.trim()) e.heroHeadline = 'Headline is required'
    if (!form.meetKatieBody.trim()) e.meetKatieBody = 'Bio is required'
    if (!form.email.trim()) e.email = 'Email is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const db = getDb()
    try {
      await setDoc(doc(db, 'settings', 'about'), {
        ...form,
        updatedAt: serverTimestamp(),
      })
      setSaved(true)
    } catch (err) {
      console.error('Save failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: 'var(--ca-font-sans)' }}>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--ca-font-heading)', color: 'var(--ca-ink)' }}
        >
          About Me &amp; Site Content
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ca-muted)' }}>
          Edit the content that appears on your homepage and footer — no code needed.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* ── Hero section ── */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Homepage Hero
          </h2>

          <Field
            label="Main headline"
            hint="The large text at the top of your homepage"
            error={errors.heroHeadline}
          >
            <input
              type="text"
              value={form.heroHeadline}
              onChange={(e) => setField('heroHeadline', e.target.value)}
              style={inputStyle(errors.heroHeadline)}
            />
          </Field>

          <Field
            label="Subtitle"
            hint="The smaller paragraph below the headline"
          >
            <textarea
              value={form.heroSubtitle}
              onChange={(e) => setField('heroSubtitle', e.target.value)}
              rows={3}
              style={{ ...inputStyle(false), resize: 'vertical' }}
            />
          </Field>
        </section>

        {/* ── What is Cartwheel Arts ── */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            What is Cartwheel Arts?
          </h2>

          <Field label="Section title">
            <input
              type="text"
              value={form.aboutTitle}
              onChange={(e) => setField('aboutTitle', e.target.value)}
              style={inputStyle(false)}
            />
          </Field>

          <Field
            label="Section content"
            hint="Use blank lines between paragraphs"
          >
            <textarea
              value={form.aboutBody}
              onChange={(e) => setField('aboutBody', e.target.value)}
              rows={6}
              style={{ ...inputStyle(false), resize: 'vertical' }}
            />
          </Field>
        </section>

        {/* ── Meet Katie ── */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Meet Katie
          </h2>

          <Field label="Section title">
            <input
              type="text"
              value={form.meetKatieTitle}
              onChange={(e) => setField('meetKatieTitle', e.target.value)}
              style={inputStyle(false)}
            />
          </Field>

          <Field
            label="Your bio *"
            hint="Use blank lines between paragraphs"
            error={errors.meetKatieBody}
          >
            <textarea
              value={form.meetKatieBody}
              onChange={(e) => setField('meetKatieBody', e.target.value)}
              rows={8}
              style={{ ...inputStyle(errors.meetKatieBody), resize: 'vertical' }}
            />
          </Field>
        </section>

        {/* ── Contact info ── */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Contact Information
          </h2>
          <p className="text-xs" style={{ color: 'var(--ca-muted)' }}>
            Shown in the site footer on every page
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email *" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                style={inputStyle(errors.email)}
              />
            </Field>

            <Field label="Phone">
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                style={inputStyle(false)}
              />
            </Field>
          </div>

          <Field label="Location / City">
            <input
              type="text"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="e.g. Kaysville, UT"
              style={{ ...inputStyle(false), maxWidth: '240px' }}
            />
          </Field>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-4 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--ca-accent)',
              color: '#ffffff',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          {saved && (
            <p className="text-sm" style={{ color: '#15803d' }}>
              ✓ Changes saved
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
