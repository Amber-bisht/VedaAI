# 🧠 VedaAI — AI-Powered Assessment Creator

VedaAI is an AI-powered assessment generation platform for teachers. Upload reference material, configure question types, and let AI generate complete question papers with answer keys — ready to download as PDF.

## ✨ Features

- **AI Question Generation** — Generates structured question papers using OpenRouter (Gemini 2.5 Flash) from uploaded reference documents (PDF, images, text)
- **Customizable Assessments** — Configure question types (MCQ, short answer, numerical, diagram-based), difficulty levels, and marks distribution
- **Real-Time Progress** — WebSocket-based live progress tracking during generation via Socket.IO
- **PDF Export** — Server-side PDF rendering with Puppeteer, stored on S3
- **Background Processing** — BullMQ + Redis job queue for async AI generation
- **Dashboard** — View, search, filter, and manage all generated assessments
- **School Settings** — Configurable school name, address, and teacher name for paper headers

## 🏗️ Architecture

This is an **npm workspaces monorepo** with three packages:

```
VedaAI/
├── package.json                 # Root workspace config
├── packages/
│   ├── frontend/                # @veda-ai/frontend — Next.js 16 (React 19)
│   │   ├── src/app/             # App Router pages (dashboard, create, assessment, settings)
│   │   ├── src/components/      # Shared UI components
│   │   └── src/store/           # Redux Toolkit state management
│   ├── backend/                 # @veda-ai/backend — Express + TypeScript
│   │   ├── src/routes/          # REST API routes
│   │   ├── src/services/        # OpenRouter AI, PDF generation, S3 storage
│   │   ├── src/models/          # Mongoose schemas (Assessment, Settings)
│   │   ├── src/queues/          # BullMQ queue setup
│   │   └── src/workers/         # Background job processors
│   └── shared/                  # @veda-ai/shared — Shared TypeScript types
│       └── src/index.ts         # Common interfaces (IQuestion, ISection, etc.)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Redux Toolkit, Tailwind CSS 4, Socket.IO Client |
| Backend | Express 4, TypeScript, Mongoose, BullMQ, Socket.IO |
| AI | OpenRouter API (Gemini 2.5 Flash) |
| Database | MongoDB |
| Queue | Redis + BullMQ |
| Storage | AWS S3 |
| PDF | Puppeteer (server-side rendering) |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **Redis** (local or cloud)
- **OpenRouter API key** ([openrouter.ai](https://openrouter.ai))
- **AWS S3 bucket** (for file and PDF storage)

### 1. Clone & Install

```bash
git clone https://github.com/Amber-bisht/VedaAI
cd VedaAI
npm install
```

Single `npm install` at the root installs dependencies for all packages.

### 2. Configure Environment

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/veda-ai
REDIS_URL=redis://127.0.0.1:6379
CLIENT_URL=http://localhost:3000

OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemini-2.5-flash

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

### 3. Run Development Servers

```bash
# Start both frontend + backend concurrently
npm run dev

# Or start individually
npm run dev:frontend    # Next.js on http://localhost:3000
npm run dev:backend     # Express on http://localhost:5001
```

## 📜 Available Scripts

All scripts run from the **project root**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers concurrently |
| `npm run dev:frontend` | Start Next.js dev server |
| `npm run dev:backend` | Start Express dev server |
| `npm run build` | Build all workspaces |
| `npm run build:frontend` | Build frontend for production |
| `npm run build:backend` | Compile backend TypeScript |
| `npm run lint` | Lint all workspaces |
| `npm run clean` | Remove node_modules, .next, dist |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assessments` | Create assessment & trigger AI generation |
| `GET` | `/api/assessments` | List all assessments |
| `GET` | `/api/assessments/:id` | Get assessment details |
| `DELETE` | `/api/assessments/:id` | Delete an assessment |
| `POST` | `/api/assessments/:id/pdf` | Generate & download PDF |
| `POST` | `/api/assessments/:id/regenerate` | Regenerate assessment questions |
| `GET` | `/api/settings` | Get school settings |
| `PUT` | `/api/settings` | Update school settings |

## 📂 Workspace Packages

| Package | Name | Description |
|---------|------|-------------|
| `packages/frontend` | `@veda-ai/frontend` | Next.js 16 web application |
| `packages/backend` | `@veda-ai/backend` | Express REST API + WebSocket server |
| `packages/shared` | `@veda-ai/shared` | Shared TypeScript interfaces |

## 📄 License

MIT
