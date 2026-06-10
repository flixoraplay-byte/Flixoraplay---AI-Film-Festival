# 🎬 FlixoraPlay

FlixoraPlay is a premium, full-stack, responsive web application designed for hosting and participating in AI-generated video competitions. Powered by **Cloudflare Pages** and **Cloudflare D1 Database**, it provides an elegant interface with rich neon/glassmorphism aesthetics, custom interactive cursor effects, and high-fidelity transitions.

---

## 🚀 Features

- **🏆 Competitions & Leaderboards**: Browse, search, and vote on AI video submissions across multiple ongoing competitions.
- **🎥 Video Submissions**: Register/login, enter challenges, and submit your AI-generated short films.
- **⚖️ Manual Judging**: Multi-criteria judging interface for hosts to score entries.
- **⚡ Full-Stack Serverless Core**: Integrated API endpoints using Cloudflare Pages Functions (`functions/api/`).
- **🗃️ D1 Relational DB**: A local and remote SQLite-compatible database to track users, competitions, entries, and votes.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Rich Custom Glassmorphism, animations, HSL CSS variables), vanilla JavaScript.
- **Backend**: Cloudflare Pages Functions (ES Modules).
- **Database**: Cloudflare D1 Database (SQLite).
- **Tooling**: Wrangler CLI (for zero-config local emulation of D1 databases and Cloudflare Edge runtimes).

---

## 📂 Project Structure

```
├── .wrangler/               # Cloudflare local environment state
├── assets/                  # Media, images, static assets
├── css/
│   └── main.css             # Main styling stylesheet (Glassmorphic, neon glow components)
├── functions/
│   └── api/                 # Pages Functions serverless endpoints
│       ├── auth.js          # Authentication endpoint
│       ├── competitions.js  # Competitions list & creation
│       ├── entries.js       # Submission and evaluation of video entries
│       ├── leaderboard.js   # Scoreboards and winners
│       └── votes.js         # Entry voting
├── js/
│   ├── app.js               # Core app logic (Auth, forms, API wrappers)
│   └── cursor.js            # Custom interactive backdrop glow cursor
├── about.html               # About FlixoraPlay
├── browse.html              # Browse video submissions
├── competition.html         # Specific competition entries
├── create-competition.html  # Competition creation portal
├── index.html               # Landing & Hero Showcase
├── judge.html               # Multi-factor score submissions
├── leaderboard.html         # Leading creators leaderboard
├── login.html               # Authenticate
├── register.html            # Join the community
├── schema.sql               # Database seeding and schemas
└── wrangler.toml            # Cloudflare Pages configurations
```

---

## ⚡ How to Run Locally

### 1. Install Dependencies
Although the application is mostly zero-dependency vanilla JS/HTML, `wrangler` is defined in `package.json` for managing D1 and local development:
```bash
npm install
```

### 2. Initialize the Local D1 Database
Execute the DB schema to create tables (`users`, `competitions`, `entries`, `votes`) and seed them with initial demo data:
```bash
npm run db:init
```

### 3. Start the Development Server
Launch the Cloudflare Pages local development emulator:
```bash
npm run dev
```

Once running, open the URL in your browser (typically `http://localhost:8788`).

---

## ☁️ Deploying to Cloudflare

### Deploy Database Schema (Remote D1)
If you are deploying to a live Cloudflare D1 instance:
```bash
npm run db:init:remote
```

### Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy .
```
