# AZAAM International Medics Network

## Clinical Attachment & Training Management Platform

AZAAM International Medics Network is a comprehensive medical training and clinical attachment platform connecting **Students**, **Universities**, **AZAAM Staff**, **Healthcare Organizations**, **Clinical Supervisors**, and **Administrators**.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Animations**: Motion / Lucide Icons

### Backend
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose (No PostgreSQL, No Prisma)
- **Authentication**: JWT (JSON Web Tokens) + bcrypt password hashing
- **Security**: Helmet, CORS, Express Rate Limiter, Zod Validation

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **PaaS / VPS Ready**: Coolify / VPS Deployment
- **Database**: MongoDB 7.0 container with named volume persistence

---

## 📁 Repository Structure (Monorepo)

```
/
├── backend/                  # Node.js + Express + Mongoose API Server
│   ├── src/
│   │   ├── config/           # Env validation & MongoDB connection module
│   │   ├── controllers/      # Express controllers
│   │   ├── middleware/       # Auth, RBAC, IDOR, Error Handler
│   │   ├── models/           # Mongoose schemas & indexes
│   │   ├── routes/           # Express API v1 routers
│   │   ├── services/         # Business logic layer
│   │   ├── types/            # TypeScript domain enums & interfaces
│   │   ├── seed.ts           # Mongoose development seed script
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # React + Vite Single-Page Application
│   ├── src/
│   │   ├── app/              # App initializers
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Auth Context & State
│   │   ├── layouts/          # PublicLayout, AuthLayout, DashboardLayout
│   │   ├── pages/            # Landing, Auth, Dashboard, Verification
│   │   ├── routes/           # AppRouter, ProtectedRoute, RoleRoute
│   │   ├── services/         # Axios API Client
│   │   └── types/            # Frontend interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Docker orchestration with MongoDB
├── .env.example              # Sample environment variables
├── ARCHITECTURE.md           # System architecture overview
├── DATABASE.md               # MongoDB & Mongoose model & indexing documentation
├── RBAC.md                   # Role-based access control & multi-tenant isolation
├── API.md                    # REST API endpoints reference
└── package.json              # Monorepo root script runner
```

---

## 🔑 Environment Variables

Create `.env` using `.env.example`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/azaam_medics_db
JWT_SECRET=azaam_super_secret_jwt_key_development_only_2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

---

## 🛠️ Development & Running

### Local Development
```bash
# Install dependencies
npm install

# Start Express server & Vite Dev Server on Port 3000
npm run dev

# Run Backend Unit & Integration Tests
npm run test

# Run TypeScript Typecheck
npm run typecheck

# Seed Development Database
npm run seed
```

### Docker Compose Setup
```bash
docker-compose up --build -d
```

---

## 🔐 Development Seed Credentials

Password for all seeded accounts: `Password123!`

- **SUPER_ADMIN**: `admin@azaammedics.org`
- **AZAAM_STAFF**: `staff@azaammedics.org`
- **UNIVERSITY_ADMIN**: `admin@hms.harvard.edu`
- **ORGANIZATION_ADMIN**: `admin@massgeneral.org`
- **CLINICAL_SUPERVISOR**: `sjenkins@massgeneral.org`
- **STUDENT (University)**: `student.harvard@azaammedics.org`
- **INDEPENDENT_APPLICANT**: `independent.student@azaammedics.org`
