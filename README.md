# ExpenseFlow — Corporate Budget & Expense Management System

A full-stack, role-based expense management application built with the
MERN stack (MongoDB, Express, React, Node) and Tailwind CSS.

Employees submit expenses, managers approve or reject them, and admins
get a full analytics dashboard over company-wide spending.

---

## ✨ Features

- JWT authentication with 3 roles: **Employee**, **Manager**, **Admin**
- Role-based route protection (frontend + backend)
- Full CRUD for expenses (create / read / update / delete)
- Manager approval workflow with comments
- Admin analytics dashboard (monthly trend, category breakdown, top spenders)
- Search, filter (status / category / date range), and pagination
- CSV export of expense reports
- High-expense highlighting
- Toast notifications, loading and error states
- Responsive, clean, light-theme UI (sidebar layout, cards, tables)

---

## 🧰 Tech Stack

| Layer     | Technology                                  |
|-----------|----------------------------------------------|
| Frontend  | React 18 (hooks), React Router, Tailwind CSS |
| Charts    | Chart.js + react-chartjs-2                   |
| Backend   | Node.js + Express                            |
| Database  | MongoDB + Mongoose                           |
| Auth      | JSON Web Tokens (JWT) + bcrypt               |
| Notifications | react-hot-toast                          |

---

## 📁 Project Structure

```
corporate-expense-system/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User, Expense (Mongoose schemas)
│   ├── middleware/                # protect / authorize / error handler
│   ├── routes/                   # auth, expenses, analytics, users
│   ├── utils/                    # JWT generator, demo data seeder
│   ├── server.js                 # Express app entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/axios.js          # Axios instance w/ auth interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/           # Sidebar, Topbar, Layout, Modal, etc.
│   │   ├── pages/                # Login, Signup, Dashboard, Expenses,
│   │   │                         # Approvals, Analytics, Profile
│   │   ├── App.jsx                # Routes + role-based guards
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI and a strong JWT_SECRET
npm run dev
```

The API starts on `http://localhost:5000` (health check at `/api/health`).

**Optional — load demo data** (2 employees, 1 manager, 1 admin, 40 sample
expenses across the last 12 months):

```bash
npm run seed
```

Demo accounts (password for all: `password123`):

| Role     | Email                |
|----------|------------------------|
| Admin    | admin@company.com      |
| Manager  | manager@company.com    |
| Employee | elena@company.com      |
| Employee | james@company.com      |

### 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your API runs on a different URL
npm run dev
```

The app starts on `http://localhost:5173`.

### 3. Log in

Visit `http://localhost:5173`, sign up for a new account (choosing a role),
or log in with one of the seeded demo accounts above.

---

## 🔐 API Overview

All endpoints are prefixed with `/api`.

| Method | Endpoint                          | Access             | Description                     |
|--------|------------------------------------|---------------------|----------------------------------|
| POST   | /auth/signup                      | Public              | Register a new user             |
| POST   | /auth/login                       | Public              | Log in, returns JWT              |
| GET    | /auth/me                          | Private             | Get current user profile        |
| PUT    | /auth/profile                     | Private             | Update name/department          |
| PUT    | /auth/change-password             | Private             | Change password                 |
| POST   | /expenses                         | Private             | Submit a new expense            |
| GET    | /expenses                         | Private             | List expenses (filters, paging) |
| GET    | /expenses/:id                     | Private             | Get one expense                 |
| PUT    | /expenses/:id                     | Owner, pending only | Edit an expense                 |
| DELETE | /expenses/:id                     | Owner, pending only | Delete an expense               |
| PUT    | /expenses/:id/review               | Manager, Admin      | Approve / reject with comment   |
| GET    | /analytics/summary                | Private             | KPI counts, scoped by role      |
| GET    | /analytics/monthly-trend           | Manager, Admin      | Approved spend by month         |
| GET    | /analytics/category-breakdown      | Manager, Admin      | Approved spend by category      |
| GET    | /analytics/top-spenders            | Manager, Admin      | Top 10 employees by spend       |
| GET    | /users                            | Admin               | List all users                  |

Every private route requires an `Authorization: Bearer <token>` header.

---

## 🏗️ Notes on Design Decisions

- **Role enforcement happens twice**: on the frontend (route guards +
  conditional UI) for UX, and on the backend (`protect` / `authorize`
  middleware) as the real source of truth — never trust the client alone.
- **Pending-only edit/delete**: once an expense is approved or rejected,
  the audit trail should stay intact, so employees can only modify
  expenses still awaiting review.
- **Analytics are scoped**: employees only ever see their own summary
  numbers; monthly trend, category breakdown, and top spenders are
  manager/admin-only since they aggregate across the whole company.

---

## 📦 Building for Production

```bash
# Frontend
cd frontend
npm run build     # outputs static files to frontend/dist

# Backend
cd backend
NODE_ENV=production npm start
```

Deploy the backend (e.g. Render, Railway, Fly.io) with your MongoDB Atlas
URI in the environment, and the frontend `dist/` folder to any static
host (Vercel, Netlify, S3) — just point `VITE_API_URL` at your deployed
backend before building.
