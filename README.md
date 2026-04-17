<div align="center">

# 🏦 PakPay

### Modern Payment Infrastructure — Production-Grade MVP

A full-stack fintech platform simulating real-world digital payment systems with microservices architecture, real-time WebSocket communication, and Docker-based cloud deployment.

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ec2/)

[Live Demo](https://pakpay10.site) · [Report Bug](https://github.com/suleman100devx/PakPay/issues) · [Request Feature](https://github.com/suleman100devx/PakPay/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Services](#-services)
- [Future Roadmap](#-future-roadmap)

---

## 🌟 Overview

PakPay is a complete MVP of a modern payment ecosystem built with a **production-first mindset**. It simulates real fintech workflows including user transactions, real-time socket notifications, and bank webhook integrations — all orchestrated via Docker Compose and deployed on AWS EC2.

**Key highlights:**
- 🔐 Secure user authentication with session management
- ⚡ Real-time transaction notifications via WebSockets
- 🏦 Bank webhook simulation with event-driven processing
- 🧩 Modular monorepo with independent microservices
- 🐳 Fully containerized with Docker Compose
- 🚀 Automated CI/CD via GitHub Actions

---

## 🏗️ Architecture

```
Client (Browser)
      │
      ▼
   Nginx (Reverse Proxy)
      │
      ├──▶ user-app        (Next.js · Port 3005)
      │         │
      │         ├──▶ bank-webhook   (Express · Port 4000)
      │         │         │
      │         │         └──▶ Redis (Pub/Sub · Port 6379)
      │         │
      │         └──▶ socket-gateway (WebSocket · Port 5000)
      │                   │
      │                   └──▶ Redis (Pub/Sub · Port 6379)
      │
      └──▶ PostgreSQL (via Prisma ORM)
```

**Monorepo structure:**

```
PakPay/
├── apps/
│   ├── user-app/          # Next.js frontend + API routes
│   ├── socket-gateway/    # WebSocket server (Socket.IO)
│   └── bank-webhook/      # Bank callback simulation
├── packages/
│   └── db/                # Prisma schema & migrations
├── docker/                # Dockerfiles per service
├── docker-compose.yml     # Multi-service orchestration
└── .env                   # Environment variables (gitignored)
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO (WebSockets) |
| Database | PostgreSQL + Prisma ORM |
| Cache / Pub-Sub | Redis |
| Containerization | Docker, Docker Compose |
| Reverse Proxy | Nginx |
| Cloud | AWS EC2 |
| CI/CD | GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Docker & Docker Compose
- PostgreSQL (only if running without Docker)

### Local Development (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/suleman100devx/PakPay.git
cd PakPay

# 2. Create your local .env file (see Environment Variables section)
cp .env.example .env

# 3. Start all services
docker compose up -d --build

# 4. Run database migrations
docker exec -it pakpay-user-app-1 npx prisma migrate deploy

# 5. Verify everything is running
docker ps
```

**Access the app:**
- 🌐 Frontend: [http://localhost:3005](http://localhost:3005)
- 🔌 Socket Gateway: [http://localhost:5000](http://localhost:5000)
- 🏦 Bank Webhook: [http://localhost:4000](http://localhost:4000)

### Local Development (Without Docker)

```bash
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file at the repo root. This file is **gitignored** — never commit it.

### Local (`.env`)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/pakpay

# App URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Services
SOCKET_CORS_ORIGIN=http://localhost:3005
BANK_WEBHOOK_URL=http://bank-webhook:3003
BANK_WEBHOOK_SECRET=change-me-min-32-chars-for-hmac-signing!!
REDIS_URL=redis://redis:6379

# Auth (set strong values in production)
JWT_SECRET=change-me-min-32-characters-long-secret
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=change-me-min-32-characters-long-secret

# Cron (optional; required in production for /api/cron/auto-settlement)
CRON_SECRET=change-me-cron-secret

# TLS helpers (behind reverse proxy)
ENFORCE_HTTPS=false
ENABLE_HSTS=false
```

### Production (EC2 `.env`)

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/pakpay

# App URLs
NEXT_PUBLIC_BASE_URL=https://pakpay10.site
NEXT_PUBLIC_SOCKET_URL=http://13.61.10.49:5000

# Services
SOCKET_CORS_ORIGIN=https://pakpay10.site
BANK_WEBHOOK_URL=http://bank-webhook:3003
BANK_WEBHOOK_SECRET=your-production-hmac-secret-min-32-chars
REDIS_URL=redis://redis:6379
JWT_SECRET=your-production-jwt-secret-min-32-chars
NEXTAUTH_URL=https://pakpay10.site
NEXTAUTH_SECRET=your-production-nextauth-secret-min-32-chars
CRON_SECRET=your-cron-bearer-token
ENFORCE_HTTPS=true
ENABLE_HSTS=true
```

> ⚠️ `NEXT_PUBLIC_*` variables are baked into the Next.js bundle **at build time**. Always rebuild the `user-app` image after changing them.

### Bank webhook signing (HMAC-SHA256)

`user-app` calls `bank-webhook` with a JSON body and header `x-pakpay-signature: sha256=<hex>`, where the hex is `HMAC-SHA256(BANK_WEBHOOK_SECRET, rawBodyUtf8)` and `rawBodyUtf8` is **exactly** the same string sent as the HTTP body (for example `JSON.stringify(payload)`). `bank-webhook` verifies the signature on every webhook route before mutating balances. Use the **same** `BANK_WEBHOOK_SECRET` in both services.

---

## Testing

```bash
npm ci
npm run db:generate:no-engine
npm test                 # Vitest (unit tests in repo)
cd apps/user-app && npm run test:e2e   # Playwright (start app on :3000 first)
```

Load smoke (optional, requires [k6](https://k6.io/)): `BASE_URL=http://localhost:3005 k6 run scripts/k6/pay-smoke.js`

---

## 🐳 Docker Deployment

All services are defined in `docker-compose.yml` and images are pushed to Docker Hub under `suleman100devx/`.

| Image | Docker Hub |
|---|---|
| user-app | `suleman100devx/pakpay-user-app:latest` |
| bank-webhook | `suleman100devx/pakpay-bank-webhook:latest` |
| socket-gateway | `suleman100devx/pakpay-socket-gateway:latest` |

**Build and push manually:**

```bash
docker compose build --push
```

**Run on EC2 (pull pre-built images):**

```bash
docker compose pull
docker compose down
docker compose up -d --no-build --remove-orphans
```

---

## 🔁 CI/CD Pipeline

Pushes to `main` trigger an automated GitHub Actions workflow:

```
git push origin main
        │
        ▼
┌─────────────────────┐
│  GitHub Actions      │
│  1. Checkout code    │
│  2. npm ci + tests   │
│  3. Login Docker Hub │
│  4. Build & Push     │  ← NEXT_PUBLIC_* vars baked in here
│     all images       │
│  5. SSH into EC2     │
│  6. Write .env file  │
│  7. Pull new images  │
│  8. docker compose   │
│     up --no-build    │
└─────────────────────┘
        │
        ▼
   Live on pakpay10.site ✅
```

**Required GitHub Secrets:**

| Secret | Value |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password |
| `SSH_HOST` | `13.61.10.49` |
| `SSH_USERNAME` | `ec2-user` |
| `SSH_KEY` | EC2 private key (`.pem` contents) |
| `NEXT_PUBLIC_SOCKET_URL` | `http://13.61.10.49:5000` |
| `NEXT_PUBLIC_BASE_URL` | `https://pakpay10.site` |
| `SOCKET_CORS_ORIGIN` | `https://pakpay10.site` |
| `REDIS_URL` | `redis://redis:6379` |
| `BANK_WEBHOOK_URL` | `http://bank-webhook:3003` |
| `DATABASE_URL` | Postgres connection string |
| `BANK_WEBHOOK_SECRET` | Shared HMAC secret (same in user-app + bank-webhook) |
| `JWT_SECRET` | Session signing (min 8 chars; use 32+ in prod) |
| `NEXTAUTH_SECRET` | Optional; falls back to `JWT_SECRET` |
| `NEXTAUTH_URL` | Public site URL, e.g. `https://pakpay10.site` |
| `CRON_SECRET` | Bearer token for `/api/cron/auto-settlement` |
| `PRISMA_ACCELERATE_URL` | Optional Prisma Accelerate URL |
| `EMAIL_USER` / `EMAIL_PASS` | Contact form SMTP (optional) |
| `CLOUDINARY_*` | KYC / logo uploads (optional) |
| `ENFORCE_HTTPS` / `ENABLE_HSTS` | `true` behind TLS terminator |

---

## 📦 Services

| Service | Port | Description |
|---|---|---|
| `user-app` | 3005 | Next.js frontend + API |
| `socket-gateway` | 5000 | Real-time WebSocket server |
| `bank-webhook` | 4000 | Bank callback simulation |
| `redis` | 6379 | Caching & pub/sub |

---

## 📈 Future Roadmap

- [ ] Payment gateway integration (Stripe / local providers)
- [ ] Admin dashboard with transaction analytics
- [ ] Transaction history & reporting
- [ ] Two-factor authentication (2FA)
- [ ] OAuth login (Google, GitHub)
- [ ] React Native mobile app
- [ ] Kubernetes deployment
- [ ] Rate limiting & fraud detection

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork this repo and open a PR.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📬 Contact

**Muhammad Suleman** — Frontend Developer | React Specialist

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-blue)](your-portfolio-link)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?logo=linkedin)](your-linkedin-link)
[![Email](https://img.shields.io/badge/Email-Contact-red)](mailto:your-email)

---

<div align="center">

⭐ **If you found this useful, please star the repo!** ⭐

*PakPay is not just a project — it's a production-style system design built to simulate real fintech workflows with scalability and modularity in mind.*

</div>
