<p align="center">
  <img src="https://img.shields.io/badge/NeuroDesk-AI%20Knowledge%20Platform-6366f1?style=for-the-badge&logo=brain&logoColor=white"/>
</p>

<h1 align="center">🧠 NeuroDesk</h1>
<p align="center"><strong>AI-powered Knowledge & Collaboration Platform for Teams</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Pinecone-Vector_DB-brightgreen?style=flat"/>
  <img src="https://img.shields.io/badge/Groq-LLM-FF6B35?style=flat"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io"/>
</p>

---

## ✨ Overview

NeuroDesk is a full-stack enterprise AI platform where teams can upload documents, index knowledge into a vector store, query it using a RAG-powered AI assistant, collaborate in real-time, and monitor usage analytics — all behind a robust RBAC permissions system.

---

## 🏗️ Architecture

```
Frontend (Next.js)
       |
  Nginx (Reverse Proxy)
       |
Backend (Express 5 + Socket.IO)
       |
  ─────────────────────────────────────
  | Auth  | Docs | RAG | Analytics |
  ─────────────────────────────────────
       |
  MongoDB  |  Pinecone (Vector DB)  |  Redis (Cache)
       |
  Groq LLM  +  Local MiniLM Embeddings
```

📐 See full architecture and diagrams → [`docs/architecture.md`](./docs/architecture.md)

---

## 🚀 Features

| Feature                                           | Status |
| ------------------------------------------------- | ------ |
| JWT Auth + Refresh Tokens                         | ✅     |
| RBAC (Admin / Manager / User)                     | ✅     |
| Document Upload (PDF, DOCX, TXT, MD)              | ✅     |
| Chunking + Local Embeddings (MiniLM, free!)       | ✅     |
| Pinecone Vector Indexing                          | ✅     |
| RAG Query Engine (confidence scoring, fallback)   | ✅     |
| Streaming AI Responses (SSE word-by-word)         | ✅     |
| Redis Caching (5-min TTL, graceful fallback)      | ✅     |
| Document Versioning + Re-Indexing                 | ✅     |
| AI Model Switching (Llama 3.1/3.3, Llama 4)       | ✅     |
| Real-Time Team Chat (Socket.IO)                   | ✅     |
| Presence Tracking (Online users)                  | ✅     |
| Admin Dashboard + User Management                 | ✅     |
| Analytics Engine (cost estimates, latency, usage) | ✅     |
| Dark/Light Mode                                   | ✅     |
| Rate Limiting + NoSQL Injection Protection        | ✅     |
| Dockerization + CI/CD                             | ✅     |

---

## 📁 Project Structure

```
NeuroDesk/
├── neuro-desk/                  # Next.js Frontend
│   ├── app/                     # App Router pages
│   ├── components/              # UI Components (Admin, shared, etc.)
│   │   ├── Admin/               # KnowledgeBase, Analytics, Settings, Users
│   │   └── shared/              # AiChat, Sidebar, NavBar
│   ├── lib/                     # Redux store, Axios instance
│   └── .env.example
│
├── neuro-desk-backend/          # Express Backend
│   ├── src/
│   │   ├── config/              # Pinecone init
│   │   ├── controllers/         # Request handlers
│   │   ├── middlewares/         # Auth, upload, validation
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # Express routers
│   │   └── services/            # Business logic (RAG, embedding, cache)
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── architecture.md          # System + DataFlow + RAG pipeline diagrams
│   ├── db-schema.md             # MongoDB schema + ERD
│   ├── api-docs.md              # Full API reference
│   └── design-decisions.md      # Tradeoffs + Scalability + Cost
│
├── docker-compose.yml
├── .github/workflows/deploy.yml # CI/CD
└── README.md
```

---

## 🔧 Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (free M0)
- Pinecone account (free serverless index)
- Groq API key (free at console.groq.com)
- Redis (optional — app works without it)

### Backend

```bash
cd neuro-desk-backend
cp .env.example .env
# Fill in .env values (see below)
npm install
npm run dev         # starts on port 5868
```

### Frontend

```bash
cd neuro-desk
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:5868/api
npm install
npm run dev         # starts on port 3000
```

### With Docker

```bash
# From project root
docker-compose up --build
```

---

## ⚙️ Environment Variables

### Backend (`.env`)

| Variable              | Required | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `MONGO_URI`           | ✅       | MongoDB Atlas connection string                  |
| `PORT`                | —        | Server port (default: 5868)                      |
| `JWT_SECRET`          | ✅       | Access token secret (min 32 chars)               |
| `JWT_REFRESH_SECRET`  | ✅       | Refresh token secret                             |
| `PINECONE_API_KEY`    | ✅       | Pinecone API key                                 |
| `PINECONE_INDEX_NAME` | ✅       | Your Pinecone index name                         |
| `GROQ_API_KEY`        | ✅       | Groq API key                                     |
| `GROQ_MODEL`          | —        | Default model (default: `llama-3.1-8b-instant`)  |
| `REDIS_URL`           | —        | Redis connection URL (optional, enables caching) |
| `NODE_ENV`            | —        | `development` or `production`                    |

### Frontend (`.env.local`)

| Variable                   | Required | Description     |
| -------------------------- | -------- | --------------- |
| `NEXT_PUBLIC_API_BASE_URL` | ✅       | Backend API URL |

---

## 🤖 AI Models Available

| Model                                       | Speed       | Quality              | Context |
| ------------------------------------------- | ----------- | -------------------- | ------- |
| `llama-3.1-8b-instant`                      | ⚡ Fast     | ⭐⭐⭐ Good          | 8K      |
| `llama-3.3-70b-versatile`                   | 🐢 Moderate | ⭐⭐⭐⭐⭐ Excellent | 32K     |
| `meta-llama/llama-4-scout-17b-16e-instruct` | ⚡ Fast     | ⭐⭐⭐⭐ Great       | 32K     |

All models hosted on Groq's H100 cluster — **significantly cheaper and faster than OpenAI GPT-4**.

---

## 📡 API Quick Reference

Base URL: `https://your-backend.onrender.com/api`

| Method | Endpoint                         | Description                  |
| ------ | -------------------------------- | ---------------------------- |
| POST   | `/auth/signup`                   | Register user                |
| POST   | `/auth/login`                    | Login → JWT + refresh cookie |
| POST   | `/auth/refresh`                  | Refresh access token         |
| GET    | `/documents`                     | List documents               |
| POST   | `/documents/upload`              | Upload + index document      |
| POST   | `/documents/:id/reindex`         | Re-index with new file       |
| POST   | `/documents/query`               | Direct RAG query             |
| POST   | `/ai-chat/sessions`              | Create chat session          |
| POST   | `/ai-chat/sessions/:id/messages` | Send message (buffered)      |
| POST   | `/ai-chat/sessions/:id/stream`   | Send message (SSE stream)    |
| GET    | `/analytics/summary`             | Platform analytics           |
| GET    | `/settings`                      | Get system settings          |
| PUT    | `/settings`                      | Update settings (Admin)      |

📖 Full API Reference → [`docs/api-docs.md`](./docs/api-docs.md)

---

## 📊 Documentation

| Document                              | Link                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| System Architecture + Data Flow       | [`docs/architecture.md`](./docs/architecture.md)         |
| Database Schema (ERD)                 | [`docs/db-schema.md`](./docs/db-schema.md)               |
| API Documentation                     | [`docs/api-docs.md`](./docs/api-docs.md)                 |
| Design Decisions + Scalability + Cost | [`docs/design-decisions.md`](./docs/design-decisions.md) |

---

## 🔐 Security Model

- **JWT Access Tokens** — 15-minute expiry, signed with HS256
- **Refresh Tokens** — 7-day expiry, stored in `httpOnly` cookie (not accessible to JS)
- **RBAC Middleware** — `verifyToken` + `restrictTo(roles)` on every protected route
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Helmet** — Sets 15 security HTTP headers
- **NoSQL Sanitization** — Strips `$` operators from all request bodies
- **Input Validation** — `express-validator` schemas on auth routes
- **CORS** — Allowlist of specific frontend origins only

---

## 🚀 Deployment

- **Frontend** → Vercel (Auto-deploy on `main` push)
- **Backend** → Render (Auto-deploy on `main` push via CI/CD)
- **CI/CD** → GitHub Actions (`.github/workflows/deploy.yml`)

---

## 📈 Cost Estimates

| Scale      | Users | Monthly Cost            |
| ---------- | ----- | ----------------------- |
| Dev/Demo   | < 100 | **$0** (all free tiers) |
| Small Team | 1K    | ~$7                     |
| Growing    | 10K   | ~$27                    |
| Enterprise | 100K  | ~$200                   |

See detailed breakdown → [`docs/design-decisions.md#4-cost-optimization-strategy`](./docs/design-decisions.md)

---

## 📝 License

MIT © 2025 Sudip Ghara
