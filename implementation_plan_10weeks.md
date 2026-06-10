# 🗓️ FlixoraPlay — 10-Week Implementation Plan

> **Start Date**: June 2026 | **End Date**: August 2026
> **Goal**: Production-ready platform with Brand AdArena™

---

## Overview

```
Week 1-2  ░░░░░░░░  Security & Auth Foundation
Week 3    ░░░░░░░░  User Profiles & Avatars
Week 4    ░░░░░░░░  Video Embeds & UX Polish
Week 5    ░░░░░░░░  Categories, Search & Filters
Week 6    ░░░░░░░░  Notifications & Email System
Week 7-8  ░░░░░░░░  Stripe Payments & Brand AdArena
Week 9    ░░░░░░░░  Creator Dashboard & Portfolios
Week 10   ░░░░░░░░  Testing, Polish & Launch
```

---

## Week 1 — Auth Security (Backend)

> **Goal**: Make authentication production-safe

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 1.1 | Install bcrypt dependency | `package.json` | `npm install bcryptjs` |
| 1.2 | Hash passwords on registration | `functions/api/auth.js` | Hash with bcrypt before INSERT |
| 1.3 | Verify hashed passwords on login | `functions/api/auth.js` | bcrypt.compare() on login |
| 1.4 | Implement JWT token generation | `functions/api/auth.js` | Sign JWT with secret from env |
| 1.5 | Create auth middleware | `functions/api/_middleware.js` | Verify JWT on protected routes |
| 1.6 | Add password_hash column | `schema.sql` | ALTER TABLE users |
| 1.7 | Input sanitization utility | `functions/api/_utils.js` | Escape HTML, validate inputs |
| 1.8 | Rate limiting on auth endpoints | `functions/api/_middleware.js` | Max 10 login attempts/min per IP |

### Database Changes
```sql
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'creator';
ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0;
```

### Deliverable
✅ Users can register/login with hashed passwords and receive JWT tokens

---

## Week 2 — Google OAuth & Session Management

> **Goal**: One-click Google sign-in + proper session handling

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 2.1 | Set up Google OAuth credentials | Google Cloud Console | Get client ID + secret |
| 2.2 | Google OAuth API endpoint | `functions/api/auth-google.js` | Handle Google callback, create/find user |
| 2.3 | Google sign-in button (Login) | `login.html` | Add "Sign in with Google" button |
| 2.4 | Google sign-in button (Register) | `register.html` | Add "Sign up with Google" button |
| 2.5 | Replace localStorage sessions with JWT | `js/app.js` | Store JWT in httpOnly cookie or localStorage with expiry |
| 2.6 | Auto-refresh expired tokens | `js/app.js` | Refresh token logic before API calls |
| 2.7 | Update `updateNavForAuth()` | `js/app.js` | Read user data from JWT payload |
| 2.8 | Protected route redirects | All pages | Redirect to login if JWT missing on protected pages |

### Environment Variables Needed
```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=xxx
```

### Deliverable
✅ Users can sign in with Google or email — sessions are JWT-based and secure

---

## Week 3 — User Profiles & Avatars

> **Goal**: Every user gets a public profile page

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 3.1 | Profile page HTML | `profile.html` *(new)* | Avatar, bio, stats, competition history |
| 3.2 | Settings page HTML | `settings.html` *(new)* | Edit profile, change password |
| 3.3 | Profile API endpoint | `functions/api/users.js` *(new)* | GET /api/users/:id — public profile data |
| 3.4 | Update user API | `functions/api/users.js` | PUT /api/users/:id — update bio, avatar |
| 3.5 | Avatar upload to R2 | `functions/api/upload.js` *(new)* | Upload image → Cloudflare R2 → return URL |
| 3.6 | Profile stats calculation | `functions/api/users.js` | Competitions entered, wins, total points, rank |
| 3.7 | Add avatar + bio columns | `schema.sql` | ALTER TABLE users |
| 3.8 | Link usernames to profiles | All pages | Clickable usernames → `/profile.html?id=xxx` |
| 3.9 | Default avatar generator | `js/app.js` | Generate initials-based avatar if no upload |

### Database Changes
```sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'bronze';
```

### New Page: `profile.html`
```
┌──────────────────────────────────────┐
│ [Avatar]  Username                   │
│           @handle · Joined June 2026 │
│           Bio text here...           │
│           🏆 3 wins · 47 pts · Gold  │
├──────────────────────────────────────┤
│ [Competition History]  [Entries]     │
│                                      │
│  🥇 Sci-Fi Visions — 1st Place      │
│  🎬 Nature Reimagined — Submitted   │
│  🥉 Emotion Reel — 3rd Place        │
└──────────────────────────────────────┘
```

### Deliverable
✅ Public profile pages with stats, avatars, and competition history

---

## Week 4 — Video Embeds & UX Polish

> **Goal**: Inline video players + mobile navigation + UI refinements

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 4.1 | YouTube/Vimeo oEmbed parser | `js/app.js` | Extract video ID → render iframe |
| 4.2 | Inline video player on entry cards | `competition.html` | Replace "Watch" link with embedded player |
| 4.3 | Video thumbnail extraction | `js/app.js` | Show YouTube thumbnail on entry card |
| 4.4 | Mobile hamburger menu | `css/main.css`, all pages | Responsive nav with slide-out menu |
| 4.5 | Mobile nav JavaScript | `js/app.js` | Toggle hamburger open/close |
| 4.6 | Loading skeletons | `css/main.css` | Skeleton loaders for cards while API loads |
| 4.7 | Empty state improvements | All pages | Better illustrations for empty states |
| 4.8 | Toast positioning fix (mobile) | `css/main.css` | Bottom-center on mobile |
| 4.9 | Competition card hover animations | `css/main.css` | Smooth scale + glow on hover |
| 4.10 | SEO meta tags | All pages | og:title, og:description, og:image |

### Deliverable
✅ Videos play inline, mobile navigation works, polished micro-interactions

---

## Week 5 — Categories, Search & Filters

> **Goal**: Users can discover competitions easily

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 5.1 | Add category field to competitions | `schema.sql`, `functions/api/competitions.js` | New column + API support |
| 5.2 | Category selector on create form | `create-competition.html` | Dropdown: Sci-Fi, Nature, Commercial, Abstract, Ad Brief, Other |
| 5.3 | Category filter on browse page | `browse.html` | Filter pills/tabs at top |
| 5.4 | Search bar on browse page | `browse.html` | Search by title, theme, host name |
| 5.5 | Status filter | `browse.html` | Filter: Open, Judging, Closed, All |
| 5.6 | Sort options | `browse.html` | Sort: Newest, Deadline Soon, Most Entries, Highest Prize |
| 5.7 | Prize range filter | `browse.html` | Filter: Free, $1-$500, $500-$2K, $2K+ |
| 5.8 | Search API endpoint | `functions/api/competitions.js` | Query params: ?q=, ?category=, ?status=, ?sort= |
| 5.9 | URL-based filter state | `browse.html` | Filters persist in URL for shareability |
| 5.10 | Category badges on comp cards | `index.html`, `browse.html` | Show category tag on each card |

### Database Changes
```sql
ALTER TABLE competitions ADD COLUMN category TEXT DEFAULT 'other';
```

### Deliverable
✅ Browse page with search, category filters, status filters, and sort options

---

## Week 6 — Notifications & Email System

> **Goal**: Users get notified about important events

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 6.1 | Notifications table | `schema.sql` | See schema from master plan |
| 6.2 | Notifications API | `functions/api/notifications.js` *(new)* | GET (list), PUT (mark read), POST (create) |
| 6.3 | Notification bell in nav | All pages (nav) | Bell icon with unread count badge |
| 6.4 | Notifications dropdown | `js/app.js`, `css/main.css` | Click bell → show recent notifications |
| 6.5 | Notifications page | `notifications.html` *(new)* | Full list with mark-all-read |
| 6.6 | Auto-create notifications | Backend endpoints | Trigger on: new entry, vote, results, deadline |
| 6.7 | Email service integration | `functions/api/_email.js` *(new)* | SendGrid or Resend API wrapper |
| 6.8 | Email templates | `functions/api/_email.js` | Welcome, entry submitted, results announced |
| 6.9 | Email verification on signup | `functions/api/auth.js` | Send verification link, verify endpoint |
| 6.10 | Deadline reminder emails | `functions/api/_cron.js` *(new)* | 3-day and 1-day deadline reminders |

### Notification Types
| Event | In-App | Email |
|-------|--------|-------|
| New entry in your competition | ✅ | ✅ |
| Someone voted on your entry | ✅ | ❌ |
| Competition results announced | ✅ | ✅ |
| Deadline in 3 days | ✅ | ✅ |
| Welcome after registration | ❌ | ✅ |
| Brand brief matches your skills | ✅ | ✅ |

### Deliverable
✅ In-app notification system + transactional emails for key events

---

## Week 7 — Stripe Payments

> **Goal**: Prize pools can be funded and paid out through the platform

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 7.1 | Install Stripe SDK | `package.json` | Stripe Node SDK |
| 7.2 | Stripe Connect onboarding | `functions/api/stripe.js` *(new)* | Brands/hosts connect Stripe accounts |
| 7.3 | Prize pool escrow flow | `functions/api/payments.js` *(new)* | Brand pays → held in Stripe → released to winner |
| 7.4 | Payment checkout page | `checkout.html` *(new)* | Stripe Elements for card payment |
| 7.5 | Payout to winners | `functions/api/payments.js` | Transfer prize to winner's connected account |
| 7.6 | Platform fee deduction | `functions/api/payments.js` | Auto-deduct 15% on AdArena, 0% on free |
| 7.7 | Payments table | `schema.sql` | Track all transactions |
| 7.8 | Payment status in UI | `competition.html` | Show "Prize Funded ✓" or "Prize Pending" |
| 7.9 | Stripe webhook handler | `functions/api/stripe-webhook.js` *(new)* | Handle payment confirmations |
| 7.10 | Payout history | `settings.html` | Users see their earnings history |

### Payment Flow
```
Brand posts $2,000 brief
  → Stripe charges $2,300 ($2,000 + 15% fee)
  → $2,000 held in escrow
  → Brand picks winner
  → $2,000 transferred to winner's Stripe
  → $300 goes to FlixoraPlay
```

### Deliverable
✅ End-to-end payment flow: fund prize → escrow → pick winner → auto-payout

---

## Week 8 — Brand AdArena™

> **Goal**: The flagship feature — brand brief marketplace

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 8.1 | Brands table + API | `schema.sql`, `functions/api/brands.js` *(new)* | Brand profiles with verification |
| 8.2 | Brand registration flow | `register.html` | "Register as Brand" option during signup |
| 8.3 | Brand onboarding page | `brand-onboard.html` *(new)* | Company name, logo, website, Stripe connect |
| 8.4 | Create Ad Brief form | `create-brief.html` *(new)* | Brand name, brief, style, duration, budget, deadline |
| 8.5 | AdArena browse page | `adarena.html` *(new)* | Grid of active brand briefs with prize amounts |
| 8.6 | Brief detail page | `brief.html` *(new)* | Full brief + submit ad entry + view submissions |
| 8.7 | AdArena nav link | All pages | Add "AdArena" to main navigation |
| 8.8 | Brand dashboard | `brand-dashboard.html` *(new)* | Manage briefs, review submissions, select winners |
| 8.9 | Commercial license agreement | `brief.html` | Terms checkbox: winner grants commercial rights |
| 8.10 | Featured brief listing | `adarena.html` | Paid featured slot at top ($99-$499) |
| 8.11 | AdArena section on homepage | `index.html` | "🔥 Active Brand Briefs" preview section |

### New Page: `adarena.html`
```
┌─────────────────────────────────────────────┐
│  🏢 Brand AdArena — Compete for Real Money  │
├─────────────────────────────────────────────┤
│ [🔍 Search briefs...]  [Filter: Industry ▾] │
│                                             │
│ ┌─ FEATURED ──────────────────────────────┐ │
│ │ Nike · "Air Max AI Dreams"              │ │
│ │ 💰 $2,000 · ⏰ 18 days · 23 entries    │ │
│ │ [View Brief →]                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│ │ Skincare  │ │ Tech App  │ │ Food      │  │
│ │ Brand     │ │ Startup   │ │ Delivery  │  │
│ │ $1,500    │ │ $800      │ │ $500      │  │
│ └───────────┘ └───────────┘ └───────────┘  │
└─────────────────────────────────────────────┘
```

### Deliverable
✅ Full Brand AdArena: brand signup → post brief → creators submit → brand picks winner → auto-payout

---

## Week 9 — Creator Dashboard & Portfolios

> **Goal**: Creators have a home base to track everything

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 9.1 | Creator dashboard page | `dashboard.html` *(new)* | Overview: entries, wins, earnings, active competitions |
| 9.2 | Stats cards | `dashboard.html` | Total entries, win rate, points, earnings |
| 9.3 | My entries list | `dashboard.html` | All entries with status (pending/scored/won) |
| 9.4 | My competitions list | `dashboard.html` | Competitions I'm hosting |
| 9.5 | Earnings tracker | `dashboard.html` | Total earned, pending payouts, payout history |
| 9.6 | Public portfolio page | `profile.html` | Enhanced profile with embedded winning videos |
| 9.7 | Share portfolio link | `profile.html` | Copy-to-clipboard shareable URL |
| 9.8 | Creator tier badges | `css/main.css`, `js/app.js` | Bronze/Silver/Gold/Platinum visual badges |
| 9.9 | Tier calculation logic | `functions/api/users.js` | Auto-calculate tier from points |
| 9.10 | "Hire Me" button on profiles | `profile.html` | Brands can contact top creators |

### Creator Tier System
| Tier | Points Required | Badge Color | Perks |
|------|----------------|-------------|-------|
| 🥉 Bronze | 0-9 pts | Brown | Basic profile |
| 🥈 Silver | 10-29 pts | Silver | Priority in search results |
| 🥇 Gold | 30-74 pts | Gold | Featured on homepage |
| 💎 Platinum | 75+ pts | Purple glow | Direct brand invitations |

### Deliverable
✅ Creator dashboard with stats, earnings, and tier-based public portfolios

---

## Week 10 — Testing, Polish & Launch

> **Goal**: Ship a production-ready platform

### Tasks

| # | Task | Files | Details |
|---|------|-------|---------|
| 10.1 | End-to-end flow testing | All pages | Test every user journey manually |
| 10.2 | Mobile responsiveness audit | All pages | Test on iPhone, Android, tablet viewports |
| 10.3 | API error handling review | All API endpoints | Consistent error responses, proper status codes |
| 10.4 | Performance optimization | `css/main.css`, images | Compress assets, lazy-load images |
| 10.5 | SEO final pass | All pages | Titles, meta descriptions, OG tags, structured data |
| 10.6 | Security audit | Auth, API | Check for XSS, SQL injection, CSRF |
| 10.7 | Deploy to Cloudflare Pages | `wrangler.toml` | Production deployment |
| 10.8 | Set up production D1 database | Cloudflare Dashboard | Create remote D1, run schema |
| 10.9 | Configure environment variables | Cloudflare Dashboard | JWT_SECRET, Stripe keys, Google OAuth, SendGrid |
| 10.10 | Seed demo data | `schema.sql` | 5 sample competitions + 3 brand briefs |
| 10.11 | Landing page update | `index.html` | Final copy, AdArena preview, updated stats |
| 10.12 | Launch checklist | — | See below |

### Launch Checklist
- [ ] All passwords hashed in production DB
- [ ] JWT secret is strong (32+ chars) and in env vars
- [ ] Google OAuth redirect URI points to production domain
- [ ] Stripe webhook endpoint configured
- [ ] SendGrid sender domain verified
- [ ] Cloudflare R2 bucket created for uploads
- [ ] Rate limiting active on all auth endpoints
- [ ] CORS configured correctly
- [ ] Custom domain connected
- [ ] SSL certificate active
- [ ] robots.txt and sitemap.xml deployed
- [ ] Analytics (Plausible or Cloudflare Web Analytics) added
- [ ] Error monitoring set up

---

## Summary: Files Created & Modified

### New Files (16)

| File | Week | Purpose |
|------|------|---------|
| `functions/api/_middleware.js` | 1 | JWT verification, rate limiting |
| `functions/api/_utils.js` | 1 | Input sanitization, helpers |
| `functions/api/auth-google.js` | 2 | Google OAuth handler |
| `profile.html` | 3 | Public user profile |
| `settings.html` | 3 | Account settings |
| `functions/api/users.js` | 3 | User profile CRUD |
| `functions/api/upload.js` | 3 | File upload to R2 |
| `notifications.html` | 6 | Notification center |
| `functions/api/notifications.js` | 6 | Notification CRUD |
| `functions/api/_email.js` | 6 | Email service wrapper |
| `checkout.html` | 7 | Stripe payment page |
| `functions/api/payments.js` | 7 | Payment processing |
| `functions/api/stripe-webhook.js` | 7 | Stripe event handler |
| `adarena.html` | 8 | Brand brief marketplace |
| `create-brief.html` | 8 | Create brand brief form |
| `brand-dashboard.html` | 8 | Brand management panel |
| `brand-onboard.html` | 8 | Brand onboarding |
| `brief.html` | 8 | Individual brief detail |
| `dashboard.html` | 9 | Creator dashboard |
| `functions/api/brands.js` | 8 | Brand profile CRUD |

### Modified Files (12)

| File | Weeks | Changes |
|------|-------|---------|
| `schema.sql` | 1,3,5,6,7,8 | New tables + columns |
| `functions/api/auth.js` | 1,2,6 | Hashing, JWT, verification |
| `js/app.js` | 2,3,4,5,6 | JWT sessions, embeds, nav, notifications |
| `css/main.css` | 3,4,5,6,9 | Profiles, mobile nav, skeletons, tiers |
| `login.html` | 2 | Google OAuth button |
| `register.html` | 2,8 | Google OAuth + brand option |
| `index.html` | 5,8,10 | Categories, AdArena section, final polish |
| `browse.html` | 5 | Search, filters, categories |
| `competition.html` | 4 | Video embeds |
| `create-competition.html` | 5 | Category selector |
| `package.json` | 1,7 | bcryptjs, stripe |
| `wrangler.toml` | 3,7 | R2 binding, env vars |

---

## Weekly Velocity Targets

| Week | New Files | Modified Files | Estimated Hours |
|------|-----------|---------------|-----------------|
| 1 | 2 | 3 | 15-20h |
| 2 | 1 | 4 | 15-20h |
| 3 | 3 | 3 | 18-22h |
| 4 | 0 | 4 | 12-16h |
| 5 | 0 | 4 | 14-18h |
| 6 | 3 | 3 | 18-22h |
| 7 | 3 | 3 | 20-25h |
| 8 | 5 | 3 | 25-30h |
| 9 | 1 | 3 | 16-20h |
| 10 | 0 | 5 | 15-20h |
| **Total** | **18** | **—** | **~170-210h** |

---

*Plan Version: 1.0 | Created: June 10, 2026*
