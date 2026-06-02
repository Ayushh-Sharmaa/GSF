# GSF — Global Society of Founders

> A global-first digital platform for student founders. Validate ideas, connect with world-class experts, and build with confidence.

[![Code Quality](https://github.com/Ayushh-Sharmaa/GSF/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/GSF/actions/workflows/code-quality.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

---

## 🏗️ Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4 |
| **Auth** | Clerk — identity, sessions, role management |
| **Database** | PostgreSQL — Drizzle ORM (Next.js) + SQLAlchemy async (Python) |
| **Python Backend** | FastAPI, SQLAlchemy async, asyncpg |
| **Email** | Nodemailer (SMTP) |
| **Webhooks** | Svix (Clerk webhook verification) |
| **Deployment** | Vercel (frontend) + Render (Python backend) |

---

## 📁 Project Structure

```
GSF/
├── app/                         # Next.js App Router pages
│   ├── (auth)/                  # Sign-in / sign-up routes
│   ├── (student)/               # Student dashboard routes
│   ├── (expert)/                # Expert dashboard routes
│   ├── (admin)/                 # Admin routes
│   ├── api/                     # Next.js API route handlers (23 endpoints)
│   ├── actions/                 # Next.js Server Actions
│   ├── layout.tsx               # Root layout (Clerk, ThemeProvider, Navbar)
│   └── globals.css              # Global styles + CSS custom properties
│
├── components/                  # Reusable React components
│   ├── ui/                      # Base UI primitives
│   ├── layout/                  # Navbar, ThemeProvider, PageTransition
│   ├── landing/                 # Marketing/landing components
│   ├── experts/                 # Expert profile components
│   ├── matching/                # Matching engine UI
│   └── ...
│
├── lib/                         # Core business logic
│   ├── api/
│   │   ├── client.ts            # ← Centralized Python backend API client
│   │   └── route-helpers.ts     # Next.js route handler utilities
│   ├── db/
│   │   ├── index.ts             # Drizzle DB singleton
│   │   └── schema.sql           # Raw SQL schema reference
│   ├── schema.ts                # Drizzle ORM schema definitions
│   ├── auth.ts                  # Clerk → AuthUser mapping
│   ├── matchingEngine.ts        # Expert-founder matching algorithm
│   ├── credits-server.ts        # Credit management (server-side)
│   ├── subscription.ts          # Subscription plan logic
│   └── ...
│
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript global type declarations
├── utils/                       # Utility functions
├── migrations/                  # SQL migration files
│
├── python-backend/              # FastAPI Python backend
│   ├── routers/                 # Route handlers (sessions, credits, ventures)
│   ├── main.py                  # App entry point (CORS, routers, health check)
│   ├── auth.py                  # Clerk JWT validation via JWKS
│   ├── database.py              # SQLAlchemy async engine
│   ├── models.py                # SQLAlchemy models
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Backend environment template
│   ├── Dockerfile               # Production Docker image
│   └── render.yaml              # Render deployment config
│
├── .github/
│   ├── workflows/               # 41 GitHub Actions workflows
│   │   └── readme.md            # Complete workflow reference
│   ├── reviewers/               # Mentor pool & stats JSON files
│   └── labels/                  # Label definitions (gssoc-labels.json)
│
├── docs/                        # Internal developer documentation
│   ├── CLERK_GUIDE.md
│   ├── SUBSCRIPTION_SYSTEM.md
│   ├── REALTIME_NOTIFICATIONS.md
│   └── ...
│
├── .env.example                 # Frontend environment template ← START HERE
├── vercel.json                  # Vercel deployment config
├── next.config.ts               # Next.js config
├── drizzle.config.ts            # Drizzle Kit config
└── tailwind.config.ts           # TailwindCSS config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** 9+
- **Python** 3.11+ (for the Python backend only)
- **PostgreSQL** database — free tier at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
- **Clerk account** — free at [clerk.com](https://clerk.com)

### 1. Clone the repo

```bash
git clone https://github.com/Ayushh-Sharmaa/GSF.git
cd GSF
```

### 2. Set up the Next.js frontend

```bash
# Install dependencies
npm install

# Copy the environment template and fill in your values
cp .env.example .env.local
```

Edit `.env.local`:
- **Clerk keys** — from [Clerk Dashboard](https://dashboard.clerk.com) → Your App → API Keys
- **DATABASE_URL** — your PostgreSQL connection string (Neon or Supabase)
- **NEXT_PUBLIC_API_URL** — `http://localhost:8000` for local development

```bash
# Run the dev server
npm run dev
# → http://localhost:3000
```

### 3. Set up the Python backend (optional for full-stack)

```bash
cd python-backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
```

Edit `python-backend/.env`:
- **DATABASE_URL** — same PostgreSQL database as the frontend
- **CLERK_DOMAIN** — your Clerk frontend API domain (e.g. `your-app.clerk.accounts.dev`)
- **FRONTEND_URL** — `http://localhost:3000`

```bash
# Run the backend
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → Health check: http://localhost:8000/health
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint via next lint |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Format all files with Prettier |
| `npm run type-check` | TypeScript type check (no emit) |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |

---

## 🌍 Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

**Frontend (`.env.local`):**
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | ✅ | Python backend URL |
| `SVIX_SECRET` | ✅ | Svix webhook signing secret |
| `EMAIL_*` | For email features | SMTP credentials |

**Python backend (`python-backend/.env`):**
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `CLERK_DOMAIN` | ✅ | Clerk JWKS domain for JWT validation |
| `FRONTEND_URL` | ✅ | Allowed CORS origin(s) |

---

## 🚢 Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set all environment variables from `.env.example` in Vercel Dashboard → Project → Settings → Environment Variables
4. Deploy — Vercel auto-deploys on every push to `main`

### Python Backend → Render

1. Connect the repo in [Render](https://render.com)
2. Use `python-backend/render.yaml` as the service definition
3. Set `DATABASE_URL`, `CLERK_DOMAIN`, `FRONTEND_URL` in Render Dashboard → Environment
4. First deploy triggers automatically

### Python Backend → Docker (self-hosted)

```bash
cd python-backend
docker build -t gsf-api .
docker run -p 8000:8000 --env-file .env gsf-api
```

---

## 🤖 GitHub Actions Workflows

This repo has **41 automated workflows** handling assignment management, PR pipelines, spam detection, mentor systems, leaderboards, code quality, and AI-assisted reviews.

See [`.github/workflows/readme.md`](.github/workflows/readme.md) for the complete reference.

**Required secrets** (set in GitHub → Repo → Settings → Secrets):
| Secret | Used by |
|--------|---------|
| `OPENAI_API_KEY` | AI slop detection, Tenet PR review |
| `PROJECTS_TOKEN` | GitHub Projects board management |

**Required repo variables** (Settings → Variables):
| Variable | Default | Used by |
|----------|---------|---------|
| `MENTOR_LEADERBOARD_ISSUE` | `1` | Mentor leaderboard |
| `CONTRIBUTOR_LEADERBOARD_ISSUE` | `2` | Contributor leaderboard |
| `PROJECT_BOARD_NUMBER` | `1` | Project board management |

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

1. Pick an issue and comment `/assign` to claim it
2. Fork the repo and create a branch: `git checkout -b feat/your-feature`
3. Make your changes with DCO sign-off: `git commit -s -m "feat: add X"`
4. Open a PR — our automated pipeline will guide you through the rest

---

## 📄 License

[MIT License](LICENSE.md) © 2025 GSF — Global Society of Founders