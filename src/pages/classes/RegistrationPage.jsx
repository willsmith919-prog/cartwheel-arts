/**
 * RegistrationPage — parent registers one or more children for a class.
 * Requires a parent account (Firebase Auth + parents Firestore doc).
 * Unauthenticated users are redirected to /account/signup.
 *
 * Supports selecting any combination of saved children plus adding new ones.
 * Submits one registration doc per child.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getDb } from '../../firebase/client'
import { useAuth } from '../../hooks/useAuth'
import { useParentProfile } from '../../hooks/useParentProfile'

// ── Shared form primitives ────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-sm font-medium"
        style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: '#b91c1c', fontFamily: 'var(--ca-font-sans)' }}>
          {error}
        </p>
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

// ── Saved child checkbox card ─────────────────────────────────────────────────

function SavedChildCard({ child, checked, onToggle }) {
  return (
    <label
      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition"
      style={{
        border: checked ? '2px solid var(--ca-accent)' : '2px solid var(--ca-border)',
        backgroundColor: checked ? '#fdf6f3' : '#ffffff',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ accentColor: 'var(--ca-accent)', width: '1.1rem', height: '1.1rem', flexShrink: 0 }}
      />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--ca-ink)' }}>{child.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ca-muted)' }}>Age {child.age}</p>
      </div>
    </label>
  )
}

// ── New child inline form ─────────────────────────────────────────────────────

function NewChildForm({ data, onChange, onRemove, errors, showRemove }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ border: '2px dashed var(--ca-accent)', backgroundColor: '#fdf6f3' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--ca-ink)' }}>New child</p>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-lg leading-none"
            style={{ color: 'var(--ca-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem' }}
            aria-label="Remove"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Name *" error={errors?.name}>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="First name"
              style={inputStyle(errors?.name)}
            />
          </Field>
        </div>
        <div style={{ width: '90px' }}>
          <Field label="Age *" error={errors?.age}>
            <input
              type="number"
              min="1"
              max="18"
              value={data.age}
              onChange={(e) => onChange('age', e.target.value)}
              placeholder="e.g. 8"
              style={inputStyle(errors?.age)}
            />
          </Field>
        </div>
      </div>

      <label
        className="flex items-center gap-2 text-sm cursor-pointer select-none"
        style={{ color: 'var(--ca-ink)' }}
      >
        <input
          type="checkbox"
          checked={data.save}
          onChange={(e) => onChange('save', e.target.checked)}
          style={{ accentColor: 'var(--ca-accent)', width: '1rem', height: '1rem' }}
        />
        Save to my account for future registrations
      </label>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RegistrationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDropIn = searchParams.get('dropin') === 'true'

  const { user, loading: authLoading } = useAuth()
  const { profile, children, loading: profileLoading } = useParentProfile()

  const [cls, setClass] = useState(null)
  const [classLoading, setClassLoading] = useState(true)

  // Checked IDs for saved children
  const [checkedIds, setCheckedIds] = useState(new Set())
  // Pending new children to add this session
  const [pendingChildren, setPendingChildren] = useState([])
  const initialized = useRef(false)

  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Redirect unauthenticated users to signup
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      const next = encodeURIComponent(`/classes/${id}/register${isDropIn ? '?dropin=true' : ''}`)
      navigate(`/account/signup?next=${next}`, { replace: true })
    }
  }, [user, authLoading, id, isDropIn, navigate])

  // Load class data
  useEffect(() => {
    const db = getDb()
    if (!db) { setClassLoading(false); return }

    async function loadClass() {
      try {
        const snap = await getDoc(doc(db, 'classes', id))
        if (!snap.exists()) { navigate('/classes'); return }
        const data = snap.data()
        if (data.status === 'full') { navigate(`/classes/${id}/waitlist`); return }
        setClass({ id: snap.id, ...data })
      } catch (err) {
        console.error('Failed to load class', err)
      } finally {
        setClassLoading(false)
      }
    }

    loadClass()
  }, [id, navigate])

  // Initialize child selection once profile loads
  useEffect(() => {
    if (profileLoading || initialized.current) return
    initialized.current = true

    if (children.length > 0) {
      // Auto-check all saved children
      setCheckedIds(new Set(children.map((c) => c.id)))
    } else {
      // No saved children — open one blank new-child form
      setPendingChildren([{ tempId: crypto.randomUUID(), name: '', age: '', save: true }])
    }
  }, [children, profileLoading])

  function toggleChild(childId) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(childId)) next.delete(childId)
      else next.add(childId)
      return next
    })
    setErrors((prev) => ({ ...prev, noChildren: undefined }))
  }

  function addPendingChild() {
    setPendingChildren((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), name: '', age: '', save: true },
    ])
    setErrors((prev) => ({ ...prev, noChildren: undefined }))
  }

  function updatePending(tempId, field, value) {
    setPendingChildren((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    )
    // Clear per-child errors when user edits
    setErrors((prev) => {
      const next = { ...prev }
      if (next[tempId]) next[tempId] = { ...next[tempId], [field]: undefined }
      return next
    })
  }

  function removePending(tempId) {
    setPendingChildren((prev) => prev.filter((c) => c.tempId !== tempId))
  }

  function validate() {
    const e = {}

    const checkedCount = checkedIds.size
    const filledPending = pendingChildren.filter((c) => c.name.trim() || c.age)

    // Validate each pending child that has any input
    for (const pending of pendingChildren) {
      const hasInput = pending.name.trim() || pending.age
      if (!hasInput) continue
      const childErrors = {}
      if (!pending.name.trim()) childErrors.name = 'Name is required'
      if (!pending.age) childErrors.age = 'Age is required'
      if (Object.keys(childErrors).length > 0) e[pending.tempId] = childErrors
    }

    if (checkedCount === 0 && filledPending.length === 0) {
      e.noChildren = 'Please select or add at least one child to register'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    if (!validate()) return
    setSaving(true)

    const db = getDb()
    if (!db) {
      alert('Firebase is not configured.')
      setSaving(false)
      return
    }

    try {
      // Build the list of children to register
      const toRegister = []

      for (const child of children) {
        if (checkedIds.has(child.id)) {
          toRegister.push({ childId: child.id, childName: child.name, childAge: child.age })
        }
      }

      for (const pending of pendingChildren) {
        if (!pending.name.trim() || !pending.age) continue
        const childName = pending.name.trim()
        const childAge = Number(pending.age)
        let childId = null

        if (pending.save) {
          const ref = await addDoc(collection(db, 'parents', user.uid, 'children'), {
            name: childName,
            age: childAge,
            createdAt: serverTimestamp(),
          })
          childId = ref.id
        }

        toRegister.push({ childId, childName, childAge })
      }

      // Write one registration doc per child
      for (const child of toRegister) {
        const regRef = doc(collection(db, 'registrations'))
        await setDoc(regRef, {
          classId: id,
          className: cls.title,
          userId: user.uid,
          childId: child.childId,
          parentName: profile.name,
          parentEmail: profile.email,
          parentPhone: profile.phone,
          childName: child.childName,
          childAge: child.childAge,
          notes: notes.trim(),
          registrationMode: isDropIn ? 'dropin' : 'bundle',
          paymentStatus: 'pending',
          registeredAt: serverTimestamp(),
        })
      }

      // Decrement spots once per registration
      await updateDoc(doc(db, 'classes', id), {
        spotsRemaining: increment(-toRegister.length),
      })

      const nameList = toRegister.map((c) => c.childName).join(',')
      navigate(
        `/classes/${id}/register/success?names=${encodeURIComponent(nameList)}&parent=${encodeURIComponent(profile.email)}`
      )
    } catch (err) {
      console.error('Registration failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isLoading = authLoading || profileLoading || classLoading

  if (isLoading) {
    return <p className="text-sm p-8" style={{ color: 'var(--ca-muted)' }}>Loading…</p>
  }

  if (!user || !profile || !cls) return null

  const price = isDropIn ? cls.dropInPrice : (cls.type === 'series' ? cls.bundlePrice : cls.price)
  const totalSelected = checkedIds.size + pendingChildren.filter((c) => c.name.trim() && c.age).length

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Back link */}
      <Link
        to={`/classes/${id}`}
        className="text-sm flex items-center gap-1"
        style={{ color: 'var(--ca-muted)' }}
      >
        ← Back to class
      </Link>

      {/* Heading */}
      <div>
        <h1 className="font-heading text-2xl font-semibold" style={{ color: 'var(--ca-ink)' }}>
          {isDropIn ? 'Drop-in Registration' : 'Register for Class'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ca-muted)' }}>{cls.title}</p>
      </div>

      {/* Price summary */}
      {price && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#fdf6f3', border: '1px solid var(--ca-border)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>
              {isDropIn ? 'Drop-in price' : cls.type === 'series' ? 'Full series price' : 'Class price'}
              {totalSelected > 1 && ` × ${totalSelected} children`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ca-muted)' }}>
              Payment will be collected at the door for now
            </p>
          </div>
          <p className="text-xl font-semibold font-heading" style={{ color: 'var(--ca-accent)' }}>
            {totalSelected > 1 ? `$${price * totalSelected}` : `$${price}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Parent account info (read-only) */}
        <section
          className="rounded-xl p-5 space-y-1"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
              Your account
            </h2>
            <button
              type="button"
              onClick={async () => {
                const { signOut } = await import('firebase/auth')
                const { getAuthInstance } = await import('../../firebase/client')
                const auth = getAuthInstance()
                if (auth) await signOut(auth)
                const next = encodeURIComponent(`/classes/${id}/register${isDropIn ? '?dropin=true' : ''}`)
                navigate(`/account/signin?next=${next}`)
              }}
              className="text-xs"
              style={{ color: 'var(--ca-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Not you? Sign out
            </button>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>{profile.name}</p>
          <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>{profile.email}</p>
          <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>{profile.phone}</p>
        </section>

        {/* Child selection */}
        <section
          className="rounded-xl p-6 space-y-3"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
              Who's registering?
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ca-muted)' }}>
              Select all children you'd like to enroll in this class.
            </p>
          </div>

          {errors.noChildren && (
            <p className="text-xs" style={{ color: '#b91c1c' }}>{errors.noChildren}</p>
          )}

          {/* Saved children */}
          {children.map((child) => (
            <SavedChildCard
              key={child.id}
              child={child}
              checked={checkedIds.has(child.id)}
              onToggle={() => toggleChild(child.id)}
            />
          ))}

          {/* Pending new children */}
          {pendingChildren.map((pending, i) => (
            <NewChildForm
              key={pending.tempId}
              data={pending}
              onChange={(field, val) => updatePending(pending.tempId, field, val)}
              onRemove={() => removePending(pending.tempId)}
              errors={errors[pending.tempId]}
              showRemove={children.length > 0 || pendingChildren.length > 1}
            />
          ))}

          {/* Add another child button */}
          <button
            type="button"
            onClick={addPendingChild}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium transition hover:opacity-80"
            style={{
              border: '2px dashed var(--ca-border)',
              backgroundColor: 'transparent',
              color: 'var(--ca-muted)',
              cursor: 'pointer',
            }}
          >
            + Add {pendingChildren.length > 0 || children.length > 0 ? 'another' : 'a'} child
          </button>
        </section>

        {/* Notes */}
        <section
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <Field label="Anything Katie should know? (allergies, accommodations, etc.)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{ ...inputStyle(false), resize: 'vertical' }}
            />
          </Field>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg py-3 text-sm font-semibold transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--ca-accent)',
            color: '#ffffff',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving
            ? 'Submitting…'
            : totalSelected > 1
            ? `Register ${totalSelected} children`
            : 'Complete Registration'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--ca-muted)' }}>
          By registering you agree to Cartwheel Arts' class policies.{' '}
          Questions?{' '}
          <a href="mailto:katie@cartwheelarts.org" style={{ color: 'var(--ca-accent)' }}>
            Email Katie
          </a>
        </p>
      </form>
    </div>
  )
}
