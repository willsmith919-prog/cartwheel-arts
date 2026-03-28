/**
 * ClassFormPage — create or edit a class (standalone or series).
 * Handles:
 *   - Class metadata (title, description, type, age range, location, capacity)
 *   - Pricing (standalone price OR series bundle + drop-in prices)
 *   - Drop-in toggle
 *   - Session management (add / remove individual session dates + times)
 *   - Image upload to Firebase Storage
 *   - Firestore write on save (creates or updates class doc + sessions subcollection)
 */
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDb, getFirebaseApp } from '../../firebase/client'

// ── helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function blankSession() {
  return { _localId: generateId(), date: '', startTime: '', endTime: '', spotsRemaining: '' }
}

function blankForm() {
  return {
    title: '',
    description: '',
    type: 'standalone',
    ageRange: '',
    location: '',
    capacity: '',
    status: 'draft',
    allowDropIn: false,
    price: '',
    bundlePrice: '',
    dropInPrice: '',
  }
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

// ── Field must be defined OUTSIDE the component to prevent re-mount on render ──
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: '#b91c1c', fontFamily: 'var(--ca-font-sans)' }}>{error}</p>}
    </div>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ClassFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(blankForm())
  const [sessions, setSessions] = useState([blankSession()])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingClass, setLoadingClass] = useState(isEdit)
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  // ── load existing class for edit mode ────────────────────────────────────

  useEffect(() => {
    if (!isEdit) return
    const db = getDb()
    if (!db) return

    async function loadClass() {
      try {
        const classDoc = await getDoc(doc(db, 'classes', id))
        if (!classDoc.exists()) {
          alert('Class not found.')
          navigate('/admin/classes')
          return
        }
        const data = classDoc.data()
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          type: data.type ?? 'standalone',
          ageRange: data.ageRange ?? '',
          location: data.location ?? '',
          capacity: data.capacity ?? '',
          status: data.status ?? 'draft',
          allowDropIn: data.allowDropIn ?? false,
          price: data.price ?? '',
          bundlePrice: data.bundlePrice ?? '',
          dropInPrice: data.dropInPrice ?? '',
        })
        if (data.imageUrl) setExistingImageUrl(data.imageUrl)
      } catch (err) {
        console.error('Failed to load class', err)
      }
    }

    function loadSessions() {
      const sessionsRef = collection(db, 'classes', id, 'sessions')
      const unsubscribe = onSnapshot(sessionsRef, (snapshot) => {
        if (snapshot.empty) {
          setSessions([blankSession()])
        } else {
          const loaded = snapshot.docs.map((d) => {
            const data = d.data()
            return {
              _localId: d.id,
              _firestoreId: d.id,
              date: data.date ?? '',
              startTime: data.startTime ?? '',
              endTime: data.endTime ?? '',
              spotsRemaining: data.spotsRemaining ?? '',
            }
          })
          setSessions(loaded)
        }
        setLoadingClass(false)
      })
      return unsubscribe
    }

    loadClass()
    const unsubscribe = loadSessions()
    return () => unsubscribe?.()
  }, [id, isEdit, navigate])

  // ── form field handlers ───────────────────────────────────────────────────

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function setSessionField(localId, key, value) {
    setSessions((prev) =>
      prev.map((s) => (s._localId === localId ? { ...s, [key]: value } : s))
    )
  }

  function addSession() {
    setSessions((prev) => [...prev, blankSession()])
  }

  function removeSession(localId) {
    setSessions((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((s) => s._localId !== localId)
    })
  }

  // ── image handling ────────────────────────────────────────────────────────

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(classId) {
    if (!imageFile) return existingImageUrl ?? null
    const app = getFirebaseApp()
    if (!app) return null
    const storage = getStorage(app)
    const storageRef = ref(storage, `class-images/${classId}/${imageFile.name}`)
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, imageFile)
      task.on(
        'state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          setUploadProgress(null)
          resolve(url)
        }
      )
    })
  }

  // ── validation ────────────────────────────────────────────────────────────

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.ageRange.trim()) e.ageRange = 'Age range is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.capacity) e.capacity = 'Capacity is required'
    if (form.type === 'standalone' && !form.price) e.price = 'Price is required'
    if (form.type === 'series' && !form.bundlePrice) e.bundlePrice = 'Bundle price is required'
    if (form.type === 'series' && form.allowDropIn && !form.dropInPrice)
      e.dropInPrice = 'Drop-in price is required when drop-in is enabled'
    sessions.forEach((s, i) => {
      if (!s.date) e[`session_date_${i}`] = 'Date required'
      if (!s.startTime) e[`session_start_${i}`] = 'Start time required'
      if (!s.endTime) e[`session_end_${i}`] = 'End time required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const db = getDb()
    if (!db) {
      alert('Firebase is not configured.')
      setSaving(false)
      return
    }

    try {
      const classId = isEdit ? id : doc(collection(db, 'classes')).id
      const imageUrl = await uploadImage(classId)
      const startDate = sessions[0]?.date || null
      const endDate = sessions[sessions.length - 1]?.date || null

      const classData = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        ageRange: form.ageRange.trim(),
        location: form.location.trim(),
        capacity: Number(form.capacity),
        status: form.status,
        allowDropIn: form.allowDropIn,
        startDate,
        endDate,
        ...(imageUrl && { imageUrl }),
        ...(form.type === 'standalone'
          ? { price: Number(form.price) }
          : {
              bundlePrice: Number(form.bundlePrice),
              ...(form.allowDropIn && { dropInPrice: Number(form.dropInPrice) }),
            }),
        ...(isEdit ? {} : { createdAt: serverTimestamp() }),
      }

      await setDoc(doc(db, 'classes', classId), classData, { merge: true })

      for (const session of sessions) {
        const sessionId = session._firestoreId ?? session._localId
        await setDoc(doc(db, 'classes', classId, 'sessions', sessionId), {
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          spotsRemaining: Number(session.spotsRemaining) || Number(form.capacity),
        })
      }

      navigate('/admin/classes')
    } catch (err) {
      console.error('Save failed', err)
      alert('Something went wrong saving the class. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingClass) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>Loading class…</p>
      </div>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: 'var(--ca-font-sans)' }}>

      {/* Page header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/classes')}
          className="text-sm mb-3 flex items-center gap-1"
          style={{ color: 'var(--ca-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back to Classes
        </button>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--ca-font-heading)', color: 'var(--ca-ink)' }}
        >
          {isEdit ? 'Edit Class' : 'New Class'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-8">

        {/* ── Section: Basic info ── */}
        <section
          className="rounded-xl p-6 flex flex-col gap-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Basic Information
          </h2>

          <Field label="Class Title *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Summer Art Camp: Portraits"
              style={inputStyle(errors.title)}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe what kids will learn and do in this class…"
              rows={4}
              style={{ ...inputStyle(false), resize: 'vertical' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Age Range *" error={errors.ageRange}>
              <input
                type="text"
                value={form.ageRange}
                onChange={(e) => setField('ageRange', e.target.value)}
                placeholder="e.g. Ages 5–12"
                style={inputStyle(errors.ageRange)}
              />
            </Field>

            <Field label="Location *" error={errors.location}>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="e.g. Stoneybrook Community School"
                style={inputStyle(errors.location)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacity (max students) *" error={errors.capacity}>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setField('capacity', e.target.value)}
                placeholder="e.g. 12"
                style={inputStyle(errors.capacity)}
              />
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                style={inputStyle(false)}
              >
                <option value="draft">Draft (hidden from public)</option>
                <option value="active">Active (visible to public)</option>
                <option value="full">Full (waitlist only)</option>
              </select>
            </Field>
          </div>

          {/* Class type toggle */}
          <Field label="Class Type">
            <div className="flex gap-3">
              {['standalone', 'series'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField('type', t)}
                  className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
                  style={{
                    backgroundColor: form.type === t ? 'var(--ca-accent)' : '#f3f4f6',
                    color: form.type === t ? '#ffffff' : 'var(--ca-ink)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </section>

        {/* ── Section: Image ── */}
        <section
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Class Image
          </h2>

          {(imagePreview || existingImageUrl) && (
            <img
              src={imagePreview ?? existingImageUrl}
              alt="Class preview"
              className="rounded-lg"
              style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }}
            />
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg text-sm font-medium w-fit"
            style={{
              border: '1px solid var(--ca-border)',
              backgroundColor: '#f9fafb',
              color: 'var(--ca-ink)',
              cursor: 'pointer',
            }}
          >
            {imagePreview || existingImageUrl ? 'Change Image' : 'Upload Image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {uploadProgress !== null && (
            <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>
              Uploading… {uploadProgress}%
            </p>
          )}
        </section>

        {/* ── Section: Pricing ── */}
        <section
          className="rounded-xl p-6 flex flex-col gap-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Pricing
          </h2>

          {form.type === 'standalone' ? (
            <Field label="Price ($) *" error={errors.price}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                placeholder="e.g. 45"
                style={{ ...inputStyle(errors.price), maxWidth: '200px' }}
              />
            </Field>
          ) : (
            <>
              <Field label="Bundle Price — full series ($) *" error={errors.bundlePrice}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.bundlePrice}
                  onChange={(e) => setField('bundlePrice', e.target.value)}
                  placeholder="e.g. 175"
                  style={{ ...inputStyle(errors.bundlePrice), maxWidth: '200px' }}
                />
              </Field>

              {/* Drop-in toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setField('allowDropIn', !form.allowDropIn)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: form.allowDropIn ? 'var(--ca-accent)' : '#d1d5db',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white"
                    style={{
                      transform: form.allowDropIn ? 'translateX(1.375rem)' : 'translateX(0.25rem)',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>
                    Allow drop-in registrations
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ca-muted)' }}>
                    Parents can register for individual sessions instead of the full series
                  </p>
                </div>
              </div>

              {form.allowDropIn && (
                <Field label="Drop-in Price per session ($) *" error={errors.dropInPrice}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.dropInPrice}
                    onChange={(e) => setField('dropInPrice', e.target.value)}
                    placeholder="e.g. 42"
                    style={{ ...inputStyle(errors.dropInPrice), maxWidth: '200px' }}
                  />
                </Field>
              )}
            </>
          )}
        </section>

        {/* ── Section: Sessions ── */}
        <section
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
                {form.type === 'series' ? 'Sessions' : 'Class Date & Time'}
              </h2>
              {form.type === 'series' && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--ca-muted)' }}>
                  Add one row per session in the series
                </p>
              )}
            </div>
            {form.type === 'series' && (
              <button
                type="button"
                onClick={addSession}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: 'var(--ca-ink)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Add Session
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {sessions.map((session, i) => (
              <div
                key={session._localId}
                className="rounded-lg p-4 flex flex-col gap-3"
                style={{ backgroundColor: '#fafaf9', border: '1px solid var(--ca-border)' }}
              >
                {form.type === 'series' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--ca-muted)' }}>
                      Session {i + 1}
                    </span>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSession(session._localId)}
                        className="text-xs"
                        style={{ color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>Date *</label>
                    <input
                      type="date"
                      value={session.date}
                      onChange={(e) => setSessionField(session._localId, 'date', e.target.value)}
                      style={inputStyle(errors[`session_date_${i}`])}
                    />
                    {errors[`session_date_${i}`] && (
                      <p className="text-xs" style={{ color: '#b91c1c' }}>{errors[`session_date_${i}`]}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>Start Time *</label>
                    <input
                      type="time"
                      value={session.startTime}
                      onChange={(e) => setSessionField(session._localId, 'startTime', e.target.value)}
                      style={inputStyle(errors[`session_start_${i}`])}
                    />
                    {errors[`session_start_${i}`] && (
                      <p className="text-xs" style={{ color: '#b91c1c' }}>{errors[`session_start_${i}`]}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>End Time *</label>
                    <input
                      type="time"
                      value={session.endTime}
                      onChange={(e) => setSessionField(session._localId, 'endTime', e.target.value)}
                      style={inputStyle(errors[`session_end_${i}`])}
                    />
                    {errors[`session_end_${i}`] && (
                      <p className="text-xs" style={{ color: '#b91c1c' }}>{errors[`session_end_${i}`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Save / Cancel ── */}
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Class'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/classes')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: '#f3f4f6',
              color: 'var(--ca-ink)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
