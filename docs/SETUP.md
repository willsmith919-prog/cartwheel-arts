# Cartwheel Arts — setup checklist

Step-by-step for GitHub, Firebase, Vercel, Stripe, and Resend. Do these once; then day-to-day work is mostly in the repo.

## 1. GitHub repository

1. On GitHub, create a new empty repository (e.g. `cartwheel-arts`).
2. In the project folder on your machine:

```bash
git init
git add .
git commit -m "Initial Cartwheel Arts scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USER/cartwheel-arts.git
git push -u origin main
```

3. Optional: turn on branch protection for `main` if you want PRs before deploys.

## 2. Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project** → name it (e.g. `cartwheel-arts`).
2. Disable Google Analytics if you do not need it (or enable if you do).
3. **Project settings** (gear) → **Your apps** → Web (`</>`) → register app → copy the config object values into `.env.local` using the names in `.env.example`.

### Firestore

1. Build → **Firestore Database** → Create database.
2. Start in **production mode** (rules already deny all in `firebase/firestore.rules` until you open specific paths).
3. Install [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
4. `firebase login` then from repo root:

```bash
firebase init firestore
```

Choose existing project, use `firebase/firestore.rules` and `firebase/firestore.indexes.json` when prompted (or copy those paths).

5. Deploy rules when you are ready:

```bash
firebase deploy --only firestore:rules
```

### Authentication

1. Build → **Authentication** → Get started.
2. Enable sign-in methods you need (e.g. **Email/Password** for admin; public registration may stay guest + Stripe only — decide with your product plan).

### Storage (optional, for images)

1. Build → **Storage** → Get started → use security rules that match your threat model (default locked down is fine to start).

### Cloud Functions (Stripe webhooks, Resend)

1. Blaze (pay-as-you-go) billing is required for Functions calling third-party APIs in many setups.
2. `firebase init functions` → TypeScript or JavaScript as you prefer.
3. Store **Stripe secret key**, **Stripe webhook signing secret**, and **Resend API key** in [Firebase environment config](https://firebase.google.com/docs/functions/config-env) or **Secret Manager** — never in the client app.

## 3. Vercel deployment

1. Sign in at [vercel.com](https://vercel.com/) with GitHub.
2. **Add New Project** → import the `cartwheel-arts` repo.
3. Framework preset: **Vite**; build command `npm run build`; output directory `dist`.
4. **Environment Variables**: add the same `VITE_FIREBASE_*` keys as in `.env.example` (values from Firebase project settings). Redeploy after changes.
5. Deploy. `vercel.json` rewrites support client-side routing (`react-router`).

Custom domain (e.g. `cartwheelarts.org`): Project → **Settings** → **Domains** → add domain and follow DNS instructions from Vercel.

## 4. Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com/) → Developers → **API keys**. Use **test** keys while building.
2. **Publishable** key (`pk_test_...`) can eventually go in Vite env as `VITE_STRIPE_PUBLISHABLE_KEY` if the client needs it for Checkout redirects (often the session is created server-side only).
3. **Secret** key (`sk_test_...`) and **webhook signing secret** (`whsec_...`) live only in **Cloud Functions** (or another server), not in Vercel client env.
4. Use **Stripe Checkout** (hosted page). After payment, a **webhook** (e.g. `checkout.session.completed`) should create/update the registration in Firestore and send email — do not rely on the success URL alone.

## 5. Resend

1. Create account at [resend.com](https://resend.com/), verify sending domain (or use their test domain for development).
2. Create an API key; store it only in Cloud Functions secrets/env.
3. Send transactional mail (registration confirmed, waitlist, etc.) from Functions after the Stripe webhook confirms payment.

## 6. Local development

```bash
cd cartwheel-arts
cp .env.example .env.local
# fill in Firebase web config
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Security reminders

- Firestore **security rules** are the source of truth for who can read/write.
- Any change to **spots remaining** or money-related state should use a **Firestore transaction** from trusted server code or carefully rule-guarded writes.
- Never commit `.env.local` or service account JSON.
