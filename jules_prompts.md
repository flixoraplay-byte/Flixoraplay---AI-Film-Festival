# 🤖 Jules Prompts for FlixoraPlay

> Copy-paste each prompt as a separate Jules task. Execute in order.
> Each task is self-contained — Jules won't need to ask for user input.

---

## Task 1 — Auth Security: Password Hashing & JWT

```
You are working on FlixoraPlay, an AI Film Festival platform built with vanilla HTML/CSS/JS frontend and Cloudflare Pages Functions backend with D1 (SQLite) database.

IMPORTANT: Do NOT ask for API keys, secrets, or environment variables. Use placeholder values like `env.JWT_SECRET` that will be configured later. Complete all code changes without waiting for user input.

Your task: Implement secure authentication with password hashing and JWT tokens.

Steps:
1. Add `bcryptjs` and `jsonwebtoken` to package.json dependencies
2. Update `schema.sql` — add these columns to the users table:
   - password_hash TEXT
   - role TEXT DEFAULT 'creator'
   - verified INTEGER DEFAULT 0
   - avatar_url TEXT
   - bio TEXT DEFAULT ''
   - total_points INTEGER DEFAULT 0

3. Rewrite `functions/api/auth.js`:
   - On registration (action: 'register'): hash password with bcryptjs (10 salt rounds) before INSERT. Store hash in password_hash column. Return a signed JWT token containing {id, username, email, role}.
   - On login (action: 'login'): fetch user by email, bcrypt.compare() the password against password_hash. If valid, return signed JWT. If invalid, return 401.
   - JWT should be signed using `env.JWT_SECRET` (accessed from the Cloudflare environment binding). Set expiry to 7 days.
   - Return the JWT as `{ token: "...", user: { id, username, email, role } }`

4. Create `functions/api/_middleware.js`:
   - Export an onRequest middleware that checks for `Authorization: Bearer <token>` header
   - Verify JWT using env.JWT_SECRET
   - If valid, attach decoded user to `context.data.user`
   - If invalid/missing, still allow the request through (some routes are public) but set `context.data.user = null`
   - Apply to all /api/* routes

5. Create `functions/api/_utils.js`:
   - Export `sanitizeInput(str)` — strips HTML tags, trims whitespace
   - Export `validateEmail(email)` — basic email regex validation
   - Export `generateId(prefix)` — returns `prefix_timestamp_random5chars`

6. Update `js/app.js`:
   - Modify `setSession(user)` to also store the JWT token: `localStorage.setItem('flixora_token', token)`
   - Modify all API.* fetch calls to include `Authorization: Bearer ${token}` header when token exists
   - Add `getToken()` helper that reads from localStorage
   - Update `clearSession()` to also remove the token

Keep the existing UI, HTML structure, and all other files unchanged. Only modify the files listed above.
```

---

## Task 2 — Google OAuth Endpoint

```
You are working on FlixoraPlay, an AI Film Festival platform. Auth is handled via `functions/api/auth.js` with bcrypt + JWT (already implemented).

IMPORTANT: Do NOT ask for API keys or credentials. Use `env.GOOGLE_CLIENT_ID` and `env.GOOGLE_CLIENT_SECRET` as placeholders — they will be configured later in Cloudflare environment variables. Complete all code without waiting for user input.

Your task: Add Google OAuth sign-in support.

Steps:
1. Create `functions/api/auth-google.js`:
   - Handle POST requests with `{ credential: "google_id_token" }` body
   - Verify the Google ID token by calling `https://oauth2.googleapis.com/tokeninfo?id_token=TOKEN`
   - Extract email, name, and sub (Google user ID) from the response
   - Check if user exists in D1 by email. If yes, generate JWT and return it. If no, create a new user with a random password_hash (they'll use Google login), set google_id = sub, and return JWT.
   - Return `{ token, user: { id, username, email, role } }`

2. Add `google_id TEXT` column to the users table in `schema.sql`

3. Update `login.html`:
   - Add a "Sign in with Google" button styled consistently with the existing glassmorphic design
   - Add the Google Identity Services script: `<script src="https://accounts.google.com/gsi/client" async defer></script>`
   - On Google callback, POST the credential to `/api/auth-google`, then store session + token and redirect to index.html
   - The Google client ID should be read from a meta tag: `<meta name="google-client-id" content="PLACEHOLDER_GOOGLE_CLIENT_ID">`

4. Update `register.html`:
   - Add the same "Sign in with Google" button with same logic
   - Position it above the registration form with an "OR" divider

Keep existing design aesthetics (dark theme, glassmorphism, purple accents). Don't modify any other files.
```

---

## Task 3 — User Profiles & Settings Pages

```
You are working on FlixoraPlay, an AI Film Festival platform with vanilla HTML/CSS/JS frontend and Cloudflare Pages Functions + D1 backend.

IMPORTANT: Complete all tasks without asking for user input. Do not wait for API keys or credentials.

Your task: Create user profile and settings pages.

Steps:
1. Create `functions/api/users.js`:
   - GET /api/users?id=xxx — return public profile: id, username, avatar_url, bio, total_points, tier, createdAt
   - Also return stats: count of entries, count of wins (rank=1), count of competitions hosted
   - Also return recent entries (last 10) with competition titles
   - PUT /api/users (requires auth) — update bio, avatar_url for the logged-in user
   - Tier calculation: 0-9pts = bronze, 10-29 = silver, 30-74 = gold, 75+ = platinum

2. Create `profile.html`:
   - Read `?id=xxx` from URL, fetch user profile from API
   - Display: avatar (or initials-based circle if no avatar), username, bio, tier badge, join date
   - Stats row: total entries, wins, points, tier
   - Competition history list: show each entry with competition name, rank badge (gold/silver/bronze if won), score
   - Style consistently with existing pages (dark theme, glassmorphic cards, purple accents, Lucide icons)
   - Include the same nav bar as other pages
   - If viewing own profile, show "Edit Profile" button linking to settings.html

3. Create `settings.html`:
   - Requires authentication — redirect to login if not signed in
   - Form fields: Username (readonly), Email (readonly), Bio (textarea), Avatar URL (text input)
   - "Change Password" section: current password, new password, confirm new password
   - Save button calls PUT /api/users
   - Password change calls POST /api/auth with action: 'change-password'
   - Style consistently with create-competition.html (same card layout, form styles)
   - Include nav bar

4. Update `functions/api/auth.js`:
   - Add action: 'change-password' — verify current password, hash new password, update

5. Make usernames clickable across the app:
   - In `competition.html`: entry creator names link to `/profile.html?id=creatorId`
   - In `index.html`: leaderboard names link to `/profile.html?id=creatorId`
   - In `leaderboard.html`: all names link to profiles

6. Add "Profile" link in the nav-actions area (next to Sign Out) when user is logged in — update `js/app.js` updateNavForAuth() function.
```

---

## Task 4 — Video Embeds & Mobile Navigation

```
You are working on FlixoraPlay, an AI Film Festival platform with vanilla HTML/CSS/JS.

IMPORTANT: Complete all tasks without asking for user input.

Your task: Add inline video players and mobile-responsive navigation.

Steps:
1. Update `js/app.js` — add video embed helpers:
   - `getYouTubeId(url)` — extract video ID from youtube.com/watch?v=, youtu.be/, youtube.com/embed/ URLs
   - `getVimeoId(url)` — extract video ID from vimeo.com/ URLs
   - `getVideoThumbnail(url)` — return YouTube thumbnail URL (https://img.youtube.com/vi/ID/hqdefault.jpg) or a placeholder for Vimeo
   - `getVideoEmbed(url)` — return an iframe HTML string for YouTube or Vimeo

2. Update `competition.html`:
   - Show video thumbnail on each entry card (in the `.entry-thumb` div, replace the film SVG icon with the actual YouTube thumbnail image)
   - When clicking "Watch", instead of opening a new tab, expand an inline iframe player below the entry card (toggle on/off)
   - Keep the external link option as a small icon button

3. Update `css/main.css` — add mobile hamburger menu:
   - At viewport <= 768px: hide `.nav-links`, show a hamburger button (three lines using CSS)
   - Clicking hamburger toggles a slide-down mobile menu showing all nav links vertically
   - Style the mobile menu with glassmorphic background matching the nav
   - Add smooth open/close transition (max-height or transform)

4. Add hamburger toggle logic in `js/app.js`:
   - Insert hamburger button HTML into nav dynamically on mobile
   - Toggle `.nav-links` visibility on click
   - Close menu when a link is clicked

5. Update ALL HTML pages (index.html, browse.html, competition.html, create-competition.html, judge.html, leaderboard.html, login.html, register.html, about.html):
   - Add a `<button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">` inside `.nav-inner`, after `.nav-logo`

6. Add loading skeleton CSS in `css/main.css`:
   - `.skeleton` class: animated gradient shimmer background
   - `.skeleton-card`: card-shaped skeleton (200px height)
   - `.skeleton-text`: text-line shaped skeleton
```

---

## Task 5 — Categories, Search & Filters

```
You are working on FlixoraPlay, an AI Film Festival platform.

IMPORTANT: Complete all tasks without asking for user input.

Your task: Add competition categories, search, and filtering to the browse page.

Steps:
1. Update `schema.sql`:
   - Add `category TEXT DEFAULT 'other'` column to competitions table
   - Update seed data to include categories: c1='sci-fi', c2='nature', c3='storytelling'

2. Update `functions/api/competitions.js`:
   - Support query params: ?category=, ?status=, ?q= (search title/theme/description), ?sort= (newest, deadline, entries, prize)
   - Filter and sort results server-side before returning

3. Update `create-competition.html`:
   - Add a category dropdown after the theme field
   - Options: sci-fi, nature, commercial, storytelling, abstract, music-video, ad-brief, other
   - Send category in the createCompetition() API call

4. Rewrite `browse.html`:
   - Add a search bar at the top (text input with search icon)
   - Add filter pills below search: category buttons (All, Sci-Fi, Nature, Commercial, Storytelling, Abstract, Music Video, Ad Brief)
   - Add status filter: All, Open, Judging, Closed
   - Add sort dropdown: Newest, Deadline Soon, Most Entries, Highest Prize
   - All filters should update the URL query params for shareability
   - Fetch from API with current filter params
   - Show result count: "Showing X competitions"
   - Style filter pills as horizontal scrollable row with active state (purple background)

5. Update `index.html`:
   - Show category badge on each competition card in the home grid
```

---

## Task 6 — Notification System

```
You are working on FlixoraPlay, an AI Film Festival platform.

IMPORTANT: Do NOT ask for API keys (e.g., SendGrid). Use `env.SENDGRID_API_KEY` as placeholder. Create email functions that are ready to use once the key is configured. Complete all tasks without waiting for user input.

Your task: Build an in-app notification system.

Steps:
1. Update `schema.sql` — create notifications table:
   ```sql
   CREATE TABLE IF NOT EXISTS notifications (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     type TEXT NOT NULL,
     title TEXT NOT NULL,
     message TEXT,
     read INTEGER DEFAULT 0,
     link TEXT,
     created_at TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

2. Create `functions/api/notifications.js`:
   - GET /api/notifications — return notifications for authenticated user (most recent 50), include unread count
   - PUT /api/notifications/:id — mark as read
   - PUT /api/notifications/read-all — mark all as read for the user
   - Internal helper: `createNotification(db, { userId, type, title, message, link })` — exported for use by other API files

3. Update these API files to trigger notifications:
   - `functions/api/entries.js` — on new entry: notify the competition host
   - `functions/api/votes.js` — on vote: notify the entry creator (batch: max 1 notification per entry per hour)
   - `functions/api/competitions.js` — on status change to 'results': notify all entrants

4. Update the nav bar across all pages:
   - Add a bell icon (Lucide 'bell') next to user avatar in nav-actions when logged in
   - Show unread count as a small red badge on the bell
   - Clicking bell opens a dropdown showing last 5 notifications with "View All" link to notifications.html

5. Create `notifications.html`:
   - Full-page notification list with mark-as-read and mark-all-read buttons
   - Each notification shows: icon (based on type), title, message, time ago, read/unread state
   - Style consistently with existing pages

6. Update `js/app.js`:
   - Add `API.getNotifications()` and `API.markNotificationRead(id)` methods
   - In `updateNavForAuth()`, fetch unread count and show badge
   - Poll for new notifications every 60 seconds when user is logged in

7. Create `functions/api/_email.js`:
   - Export `sendEmail({ to, subject, html })` using SendGrid HTTP API (fetch to https://api.sendgrid.com/v3/mail/send)
   - Use `env.SENDGRID_API_KEY` and `env.FROM_EMAIL` from environment
   - If API key is not set, log a warning and skip sending (graceful fallback)
   - Export email templates: `welcomeEmail(username)`, `resultsAnnouncedEmail(competitionTitle, rank)`
```

---

## Task 7 — Stripe Payments

```
You are working on FlixoraPlay, an AI Film Festival platform.

IMPORTANT: Do NOT ask for Stripe API keys. Use `env.STRIPE_SECRET_KEY` and `env.STRIPE_WEBHOOK_SECRET` as placeholders. All payment features should work code-wise and be ready for key configuration later. Complete all tasks without waiting for user input.

Your task: Integrate Stripe for prize pool payments.

Steps:
1. Add `stripe` to package.json dependencies

2. Update `schema.sql` — create payments table:
   ```sql
   CREATE TABLE IF NOT EXISTS payments (
     id TEXT PRIMARY KEY,
     competition_id TEXT NOT NULL,
     payer_id TEXT NOT NULL,
     payee_id TEXT,
     amount_cents INTEGER NOT NULL,
     currency TEXT DEFAULT 'usd',
     type TEXT NOT NULL,
     status TEXT DEFAULT 'pending',
     stripe_session_id TEXT,
     created_at TEXT NOT NULL,
     FOREIGN KEY (competition_id) REFERENCES competitions(id)
   );
   ```
   Add `prize_pool_cents INTEGER DEFAULT 0` and `prize_funded INTEGER DEFAULT 0` columns to competitions table.

3. Create `functions/api/payments.js`:
   - POST /api/payments/checkout — create a Stripe Checkout Session for funding a prize pool. Accept {competitionId, amountCents}. Return {checkoutUrl}. Calculate 15% platform fee on top.
   - GET /api/payments/success — handle Stripe success redirect, update payment status to 'completed', set competition.prize_funded = 1
   - POST /api/payments/payout — transfer prize to winner (admin/host only). Accept {competitionId, winnerId, amountCents}. Create a Stripe Transfer.
   - GET /api/payments/history — return payment history for authenticated user

4. Create `functions/api/stripe-webhook.js`:
   - Handle POST requests from Stripe webhooks
   - Verify webhook signature using env.STRIPE_WEBHOOK_SECRET
   - Handle events: checkout.session.completed, transfer.created
   - Update payment records in D1 accordingly

5. Create `checkout.html`:
   - Simple page that redirects to Stripe Checkout
   - Shows competition title, prize amount, platform fee breakdown
   - "Fund Prize Pool" button that calls POST /api/payments/checkout and redirects to the returned checkoutUrl
   - Success/cancel URL handling

6. Update `competition.html`:
   - Show "Prize Funded ✓" badge if competition.prize_funded = 1
   - Show "Fund Prize" button for host if prize is set but not funded

7. Update `js/app.js`:
   - Add API.createCheckout() and API.getPaymentHistory() methods
```

---

## Task 8 — Brand AdArena Marketplace

```
You are working on FlixoraPlay, an AI Film Festival platform. Stripe payments are already integrated (functions/api/payments.js).

IMPORTANT: Complete all tasks without asking for user input. Do not wait for any credentials or keys.

Your task: Build the Brand AdArena — a marketplace where brands post paid AI video ad briefs.

Steps:
1. Update `schema.sql` — create brands table:
   ```sql
   CREATE TABLE IF NOT EXISTS brands (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     company_name TEXT NOT NULL,
     logo_url TEXT,
     website TEXT,
     industry TEXT,
     verified INTEGER DEFAULT 0,
     created_at TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```
   Add to competitions: `is_brand_brief INTEGER DEFAULT 0`, `brand_id TEXT`, `featured INTEGER DEFAULT 0`

2. Create `functions/api/brands.js`:
   - POST /api/brands — register as brand (requires auth). Accept {companyName, website, industry, logoUrl}. Set user role to 'brand'.
   - GET /api/brands/:id — return brand profile
   - GET /api/brands — list all verified brands

3. Create `adarena.html`:
   - Hero section: "Brand AdArena — Compete for Real Money"
   - Filters: industry dropdown, sort by prize/deadline/entries
   - Grid of brand brief cards showing: brand logo + name, brief title, prize amount, deadline, entry count, "View Brief →" button
   - "Post a Brief" CTA button for brands
   - Same nav, footer, and dark glassmorphic styling as all other pages

4. Create `create-brief.html`:
   - Requires auth + brand role
   - Form: Brief Title, Brand/Campaign Name, Description, Style Requirements, Video Duration (15s/30s/60s), Prize Pool ($), Deadline, Industry Category
   - Checkbox: "Winner grants full commercial usage rights"
   - Preview card (like create-competition.html)
   - On submit: create competition with is_brand_brief=1, redirect to checkout to fund prize pool

5. Create `brief.html`:
   - Read ?id=xxx from URL, fetch competition where is_brand_brief=1
   - Show: brand logo, brief details, requirements, prize breakdown (winner gets X, runner-up gets Y, platform fee)
   - Entry submission form (same as competition.html submit modal)
   - Grid of submitted AI ad entries with voting
   - "Select Winner" button visible only to the brand owner

6. Add "AdArena" link to navigation on ALL pages (between Browse and Leaderboard):
   ```html
   <a href="adarena.html" class="nav-link"><svg data-lucide="briefcase"></svg> AdArena</a>
   ```

7. Update `index.html`:
   - Add a new section before the CTA: "🔥 Brand AdArena" showing latest 3 brand briefs
   - Fetch from API where is_brand_brief=1, display as cards with prize amounts

8. Add seed data in schema.sql — 2 sample brand briefs:
   - Brand: "GlowSkin Co" / Industry: Beauty / Prize: $1500 / Brief: "30-second AI video ad for our new moisturizer line"
   - Brand: "TechPulse" / Industry: Technology / Prize: $2000 / Brief: "15-second cinematic AI ad for our wireless earbuds launch"
```

---

## Task 9 — Creator Dashboard

```
You are working on FlixoraPlay, an AI Film Festival platform.

IMPORTANT: Complete all tasks without asking for user input.

Your task: Build a creator dashboard page.

Steps:
1. Create `dashboard.html`:
   - Requires authentication — redirect to login.html if not signed in
   - Header: "Welcome back, [username]" with avatar and tier badge
   - Stats row (4 cards): Total Entries, Wins, Global Points, Earnings ($0 if no payouts)
   - "My Entries" section: list of all entries by this user, showing competition name, submission date, status (pending/scored/won), score, rank badge
   - "My Competitions" section (if user has hosted): list of competitions they created, with entry count, status, deadline
   - "My Brand Briefs" section (if user is brand): list of brand briefs with submission count
   - Style consistently with existing pages (dark theme, glassmorphic cards)
   - Include standard nav bar and footer

2. Create `functions/api/dashboard.js`:
   - GET /api/dashboard — requires auth. Return:
     - user profile data
     - stats: { totalEntries, wins, points, earnings }
     - recentEntries: last 20 entries with competition titles
     - hostedCompetitions: competitions where hostId = user.id
     - brandBriefs: competitions where brand_id = user brand id (if applicable)

3. Update nav — add "Dashboard" link visible only when logged in:
   - In `js/app.js` updateNavForAuth(): add dashboard link before the avatar

4. Add tier badge CSS in `css/main.css`:
   - `.tier-badge` base class with small pill shape
   - `.tier-bronze` — brown/copper gradient
   - `.tier-silver` — silver/gray gradient  
   - `.tier-gold` — gold gradient
   - `.tier-platinum` — purple glow gradient with subtle animation

5. Update `js/app.js`:
   - Add `API.getDashboard()` method
   - Add `getTierBadge(tier)` helper that returns HTML for the tier badge
```

---

## Task 10 — Final Polish & SEO

```
You are working on FlixoraPlay, an AI Film Festival platform.

IMPORTANT: Complete all tasks without asking for user input.

Your task: Final polish, SEO optimization, and production readiness.

Steps:
1. Add SEO meta tags to ALL HTML pages:
   - <meta name="description" content="..."> (unique per page)
   - <meta property="og:title">, og:description, og:type, og:url
   - <meta name="twitter:card" content="summary_large_image">
   - Proper <title> tags already exist — verify they're descriptive

2. Create `robots.txt`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://flixoraplay.pages.dev/sitemap.xml
   ```

3. Create `sitemap.xml` with all static pages:
   - index.html, browse.html, adarena.html, leaderboard.html, about.html, login.html, register.html

4. Add structured data (JSON-LD) to `index.html`:
   - WebSite schema with name "FlixoraPlay" and description
   - Organization schema

5. Accessibility improvements across all pages:
   - Add aria-labels to all icon-only buttons
   - Ensure all form inputs have associated labels
   - Add alt text to any images
   - Ensure color contrast meets WCAG AA

6. Update `css/main.css`:
   - Add `prefers-reduced-motion` media query — disable animations for users who prefer reduced motion
   - Add print stylesheet basics

7. Update `about.html`:
   - Add section explaining Brand AdArena
   - Add FAQ section with common questions
   - Update platform description to mention all new features

8. Error handling in `js/app.js`:
   - Add global error handler: window.onerror and unhandledrejection
   - Show user-friendly toast for network errors
   - Add retry logic (1 retry) for failed API calls
```

---

## How to Use These Prompts

1. Go to [Jules](https://jules.google.com) or your GitHub repo's Jules integration
2. Copy **Task 1** prompt → paste as a new Jules task → let it run
3. **Review & merge** the PR Jules creates
4. Then do **Task 2**, and so on in order
5. Tasks 1-6 are sequential (each depends on previous)
6. Tasks 7-8 depend on each other (payments → AdArena)
7. Task 9-10 can run after all others are merged
