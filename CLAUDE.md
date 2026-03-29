# Cartwheel Arts — Claude Code Context

## Project Overview
Class registration web app for Cartwheel Arts (cartwheelarts.org) — a kids art and emotional
wellness business run by Katie Newbold Smith in Kaysville, UT. Replacing a manual workflow
(Google Forms + Sheets + Venmo + texts) with a purpose-built platform.

Live at: https://cartwheel-arts.vercel.app
GitHub: cartwheel-arts

---

## Tech Stack
| Layer | Tool |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (CSS variable based, no tailwind.config.js) |
| Routing | React Router v7 |
| Hosting | Vercel |
| Database | Firestore (Firebase 12) |
| Auth | Firebase Auth (email/password) |
| Backend | Firebase Cloud Functions (planned) |
| Payments | Stripe (planned — placeholder flow currently) |
| Email | Resend (planned) |
| Storage | Firebase Storage (pending Blaze plan upgrade) |

---

## Project Structure
```
src/
├── assets/
│   └── cartwheel-logo.jpg
├── components/
│   ├── Layout.jsx          # Public site shell (header + footer + outlet)
│   ├── ProtectedRoute.jsx  # Redirects to /admin/login if not authenticated
│   ├── SiteFooter.jsx
│   └── SiteHeader.jsx      # Nav + sign in/out button
├── firebase/
│   └── client.js           # getFirebaseApp(), getDb(), getAuthInstance()
├── hooks/
│   ├── useAuth.js          # { user, loading } — watches Firebase auth state
│   └── useParentProfile.js # { profile, children, loading } — loads parents/{uid} + children subcollection
├── pages/
│   ├── BlogPage.jsx        # Public blog — reads published posts from Firestore
│   ├── HomePage.jsx        # Landing page with real brand content
│   ├── account/
│   │   ├── SignUpPage.jsx  # Parent account creation (email/password + name/phone)
│   │   └── SignInPage.jsx  # Returning parent login
│   ├── classes/
│   │   ├── ClassesPage.jsx           # Public class browser
│   │   ├── ClassDetailPage.jsx       # Individual class detail + register CTA
│   │   ├── RegistrationPage.jsx      # Registration form — requires parent account; child selector
│   │   ├── RegistrationSuccessPage.jsx
│   │   └── WaitlistPage.jsx          # Waitlist form for full classes
│   └── admin/
│       ├── AdminLayout.jsx     # Sidebar nav shell for all admin pages
│       ├── AdminAboutPage.jsx  # Edit homepage/about content (saves to Firestore)
│       ├── AdminBlogPage.jsx   # Write/publish/delete blog posts
│       ├── ClassFormPage.jsx   # Create/edit classes + sessions
│       ├── ClassListPage.jsx   # Admin class list with edit/archive/roster actions
│       ├── LoginPage.jsx       # Firebase Auth login
│       └── RosterPage.jsx      # Per-class roster of registered students
├── App.jsx                 # All routes defined here
├── main.jsx
├── index.css
└── theme.js                # Brand tokens + applyBrandTokens()
```

---

## Brand Tokens (theme.js)
```js
canvas:      '#faf8f5'  // background
ink:         '#1c1917'  // text
accent:      '#c45c3e'  // terracotta — primary buttons, links
accentMuted: '#e8b4a4'
muted:       '#78716c'
border:      '#e7e5e4'
fontSans:    system-ui stack
fontHeading: Georgia/serif stack
```
CSS variables: `--ca-canvas`, `--ca-ink`, `--ca-accent`, `--ca-accent-muted`, `--ca-muted`,
`--ca-border`, `--ca-font-sans`, `--ca-font-heading`

---

## Firestore Data Model

### `classes` collection
```
id, title, description, imageUrl, type ('standalone' | 'series'),
status ('draft' | 'active' | 'full' | 'archived'),
ageRange, location, capacity, spotsRemaining,
allowDropIn (bool), bundlePrice, dropInPrice, price,
startDate, endDate, createdAt
```

### `classes/{id}/sessions` subcollection
```
id, date (string 'YYYY-MM-DD'), startTime (string 'HH:MM'),
endTime (string 'HH:MM'), spotsRemaining
```

### `parents` collection
```
id (= Firebase Auth uid), name, email, phone, createdAt (timestamp)
```

### `parents/{uid}/children` subcollection
```
id, name, age, createdAt (timestamp)
```

### `registrations` collection
```
id, classId, className,
userId (parent uid), childId (child doc id — null if not saved to account),
parentName, parentEmail, parentPhone,
childName, childAge, notes, registrationMode ('bundle' | 'dropin'),
paymentStatus ('pending' | 'paid' | 'refunded'),
registeredAt (timestamp)
```

### `waitlist` collection
```
id, classId, className, parentName, parentEmail, parentPhone,
childName, childAge, joinedAt (timestamp), notified (bool)
```

### `posts` collection
```
id, title, body, status ('draft' | 'published'),
createdAt (timestamp), updatedAt (timestamp)
```

### `settings/about` document
```
heroHeadline, heroSubtitle, aboutTitle, aboutBody,
meetKatieTitle, meetKatieBody, email, phone, location, updatedAt
```

---

## Routes
```
/                           HomePage
/blog                       BlogPage
/classes                    ClassesPage
/classes/:id                ClassDetailPage
/classes/:id/register       RegistrationPage
/classes/:id/register/success  RegistrationSuccessPage
/classes/:id/waitlist       WaitlistPage
/account/signup             SignUpPage (public — parent account creation)
/account/signin             SignInPage (public — parent login; /signin also redirects here)
/admin/login                LoginPage (public)
/admin                      → redirects to /admin/classes
/admin/classes              ClassListPage (protected)
/admin/classes/new          ClassFormPage (protected)
/admin/classes/:id/edit     ClassFormPage (protected)
/admin/rosters/:id          RosterPage (protected)
/admin/blog                 AdminBlogPage (protected)
/admin/about                AdminAboutPage (protected)
```

---

## Auth
- Two types of Firebase Auth users: admin (Katie, created manually) and parents (self-serve via /account/signup)
- Admin is distinguished from parents by the absence of a `parents/{uid}` Firestore doc
- `ProtectedRoute` checks for a `parents/{uid}` doc — if found, redirects to `/` (blocks parents from admin)
- `useAuth()` hook watches auth state — returns `{ user, loading }`
- `useParentProfile()` hook loads `parents/{uid}` + children subcollection
- Admin portal accessed directly via `/admin` URL (not linked in public nav)
- Parents sign up at `/account/signup`, sign in at `/account/signin`
- Registration page redirects unauthenticated users to `/account/signup?next=<registration url>`

---

## Firestore Security Rules (current)
- Public read: `classes`, `sessions`, `posts`, `settings`
- Public create: `registrations`, `waitlist`
- Public update: `classes` (for spotsRemaining decrement — to be moved to Cloud Function with Stripe)
- Authenticated user read/write own doc: `parents/{uid}`, `parents/{uid}/children`
- Authenticated read/write: everything else (admin)
- NOTE: Rules need updating to allow parents to read/write their own `parents/{uid}` doc and children subcollection

---

## Code Conventions
- Functional React components with hooks only — no class components
- `async/await` — never raw `.then()` chains
- Always `try/catch` on async operations
- Tailwind utility classes for layout/spacing, inline `style` props for brand colors/fonts
- Component definitions MUST live outside parent component functions
  (prevents re-render bugs that cause inputs to lose focus)
- `Field` wrapper component pattern used in all forms — defined outside the page component
- `inputStyle(hasError)` helper function pattern used in all forms
- Firebase imports: always use `getDb()` and `getAuthInstance()` from `../../firebase/client`
  (never import firebase directly in page components)
- All admin pages live in `src/pages/admin/`
- All class-related public pages live in `src/pages/classes/`

---

## Current State & What Works
✅ Admin login / logout
✅ Class creation (standalone + series, drop-in toggle, sessions)
✅ Class editing and archiving
✅ Public class browser (active classes only)
✅ Class detail page with sessions list
✅ Registration form → saves to Firestore → success page
✅ Waitlist form → saves to Firestore
✅ Admin roster view per class
✅ Blog post management (admin write, public read)
✅ About Me / site content editor (saves to Firestore settings/about)
✅ Homepage with real brand content
✅ Vercel deployment live at cartwheel-arts.vercel.app
✅ Parent account creation (signup/signin) with child records saved to Firestore
✅ Registration gated behind parent account — redirects to signup if not logged in
✅ Child selector on registration (existing saved children + add new child)
✅ Registrations tied to userId + childId

---

## Known Issues / Bookmarked Items
- Waitlist admin view not built yet (RosterPage has a stub placeholder)
- Image uploads blocked — Firebase Storage requires Blaze plan upgrade
- `spotsRemaining` decrement happens client-side — needs to move to Cloud Function once Stripe is added
- Firestore security rules need updating to allow `parents/{uid}` self-read/write (currently relies on broad auth rule)
- No "My Account" / registration history page for parents yet
- No password reset flow for parents

---

## Prioritized Backlog (Katie's list)
1. Set up Katie's admin email account
2. Parent accounts as part of signup flow
3. Multi-child signup (stored in parent accounts)
4. Paperwork / e-sign flow + questions during registration
5. Roster updates to surface paperwork data
6. Communication / reminder system (texts or emails via Resend)
7. Stripe payments
8. Waitlist admin functionality
9. Firebase Storage (Blaze plan upgrade first)
10. Rich text editing for blog, About Me, and class descriptions

---

## Environment Variables (.env.local)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## Important Notes for Claude Code
- Never expose Firebase admin credentials or Stripe secret keys in client-side code
- All Stripe webhook logic must live in Firebase Cloud Functions, not client code
- Firestore queries combining `where()` + `orderBy()` require composite indexes
  — follow the Firebase Console link in browser errors to create them
- Firebase Storage is deferred — do not add image upload code until Blaze plan is confirmed
- The admin user is Will (testing) and Katie (production) — single admin, no multi-user admin needed
- Katie is non-technical — admin UI must be simple and self-explanatory
- Parents are the public users — registration flow must be mobile-friendly
