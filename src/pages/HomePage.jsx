/**
 * Cartwheel Arts landing page — real brand content from cartwheelarts.org
 */
import { Link } from 'react-router-dom'
import cartwheelLogo from '../assets/cartwheel-logo.jpg'

export default function HomePage() {
  return (
    <div className="space-y-16 text-left">

      {/* ── Hero ── */}
      <div className="flex flex-col items-center text-center gap-6 pt-8">
        <img
          src={cartwheelLogo}
          alt="Cartwheel Arts"
          className="h-32 w-auto"
        />
        <div>
          <h1
            className="font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
          >
            Art, movement &amp; emotional wellness for kids
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg leading-relaxed text-muted">
            In Cartwheel Arts, kids learn how to process big emotions in healthy
            ways — using nature-based art, movement, mindfulness, and play.
            Restoring carefree creativity, self-love, and confidence so every
            child can thrive.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/classes"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            View classes &amp; register
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-stone-50"
          >
            News &amp; updates
          </Link>
        </div>
      </div>

      {/* ── What is Cartwheel Arts ── */}
      <div
        className="rounded-2xl p-8"
        style={{ backgroundColor: '#fdf6f3', border: '1px solid var(--ca-border)' }}
      >
        <h2 className="font-heading text-2xl font-semibold text-ink mb-4">
          What is Cartwheel Arts?
        </h2>
        <p className="text-muted leading-relaxed mb-4">
          The more children can love and accept themselves, the healthier and
          more confident they will be as teens and adults. We teach kids that
          humans were designed to feel a full range of emotions and then let
          them go — it's all just a part of this life experience.
        </p>
        <p className="text-muted leading-relaxed">
          Emotions come and go, and if we pause to acknowledge them and feel
          them in healthy ways, they can move through us more easily. Cartwheel
          Arts gives children the tools to do exactly that — through creativity,
          play, and connection.
        </p>
      </div>

      {/* ── Meet Katie ── */}
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="flex-1">
          <h2 className="font-heading text-2xl font-semibold text-ink mb-4">
            Meet Katie
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Hi! I'm Katie Newbold Smith, founder of Cartwheel Arts. With my
            master's in Human Development &amp; Social Policy and certifications
            in Intuitive Cranial Sacral Therapy and Quantum Human Design Family
            Coaching, I've developed methods to help individuals and families
            live with more self-love and harmony.
          </p>
          <p className="text-muted leading-relaxed mb-6">
            I'm a mother to three spirited and creative daughters, wife to a
            very supportive husband, and owner of the cutest Havanese puppy.
            You can often find me journaling near a stream, spontaneously
            following the creative flow, or digging deep into Human Design.
          </p>
          <Link
            to="/classes"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Explore classes
          </Link>
        </div>
      </div>

      {/* ── Offerings overview ── */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-ink mb-6">
          What we offer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: '🎨',
              title: 'Art Classes for Kids',
              desc: 'In-person classes combining nature-based art, movement, and emotional processing tools.',
            },
            {
              icon: '🌿',
              title: 'Series &amp; Camps',
              desc: 'Multi-week series and seasonal camps that go deeper into creativity and self-expression.',
            },
            {
              icon: '👨‍👩‍👧',
              title: 'Family Coaching',
              desc: 'Human Design family coaching to help parents understand and support their children\'s unique gifts.',
            },
            {
              icon: '✨',
              title: 'Adult Offerings',
              desc: 'Emotional processing webinars, Cranial Sacral sessions, and one-on-one Human Design coaching.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl p-5"
              style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3
                className="font-heading font-semibold text-ink mb-1"
                dangerouslySetInnerHTML={{ __html: item.title }}
              />
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
