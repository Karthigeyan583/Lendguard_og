# LendGuard - Personal & Business Lending Ledger Platform

> **LendGuard Product Development Bible v2.0**  
> *"Know who owes me, how much, when due, what was repaid, and what remains — with cryptographic audit trail."*

[![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Decoupled-blue.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-Django%20REST%20Framework-092E20.svg)](https://www.django-rest-framework.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB.svg)](https://vitejs.dev/)
[![OpenAPI](https://img.shields.io/badge/API-OpenAPI%203.0%20/%20Swagger-85EA2D.svg)](#)

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 1. FRONTEND: 100% REACT (SPA)               │
│  • Vite + React 18 + Vanilla CSS Design System              │
│  • Screens P01–P30: Dashboard, People, Loans Ledger,        │
│    Overdue Aging, EMI Calculator, Digital Statements        │
│  • Day / Night Mode Theme Switching with Local Persistence  │
│  • Runs on: http://localhost:5173                           │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API JSON (/api/v1/...)
                               │  Authorization: Token <key>
┌──────────────────────────────▼──────────────────────────────┐
│                2. BACKEND: 100% REST API                    │
│  • Headless Django REST Framework API Engine                │
│  • Deterministic Balance & Status Engines                   │
│  • Automated Reminder Engine (T-7d, T-3d, T-1d, Overdue)    │
│  • Statement Engine with Cryptographic SHA-256 Seal         │
│  • Interactive Swagger / OpenAPI Docs: /api/docs/           │
│  • Runs on: http://127.0.0.1:8000                           │
└──────────────────────────────┬──────────────────────────────┘
                               │  psycopg2 Connection Pool
                               │  PostgreSQL (Port 5432)
┌──────────────────────────────▼──────────────────────────────┐
│               3. DATABASE: 100% POSTGRESQL                  │
│  • Database Name: lendguard_db                              │
│  • Models: Workspaces, People, Loans, Payments,             │
│    Reminders, Notifications, Digital Statements, Auth       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

1. **Deterministic Financial Engines**:
   - **Balance Engine**: Decimal-safe arithmetic computing total principal, fees, non-voided repayments, and net outstanding balance.
   - **Status Engine**: Evaluates financial states (`OPEN`, `PARTIALLY_PAID`, `PAID`, `WRITTEN_OFF`, `CANCELLED`) and urgency time states (`UPCOMING`, `DUE_TODAY`, `DUE_SOON`, `OVERDUE`).
   - **Overpayment Prevention**: Rejects any repayment amount exceeding the actual remaining balance.
   - **Void & Reversal Audit**: Safely reverses mistaken transactions without destructive data deletion.

2. **Verifiable Digital IOU & Statements**:
   - Generates immutable canonical data snapshots.
   - Seals each loan statement with a verifiable **Cryptographic SHA-256 Hash**.
   - Printable & downloadable legal receipts for both lender and borrower.

3. **Overdue Aging Analysis (P21)**:
   - Buckets outstanding overdue balances into **0–7d**, **8–30d**, **31–60d**, and **60+ days**.

4. **People & Contact Directory (P11–P13)**:
   - Tracks borrower contacts with relationship categorization (`Friend`, `Family`, `Colleague`, `Business`).
   - Displays real-time exposure meters and total lending history per contact.

5. **Authentication Gateway**:
   - Email OR username login support.
   - Strict registration validation with personal workspace provisioning.
   - Post-registration redirect directly to Sign In for explicit authentication.

6. **Day & Night Mode**:
   - Theme toggle with instant transition between high-contrast dark theme and crisp light theme.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 14+ running on `localhost:5432`

---

### Backend Setup (Django REST API + PostgreSQL)

```bash
# 1. Navigate to Backend directory
cd Backend

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure PostgreSQL environment
cp .env.example .env
# Edit .env to verify DB_NAME=lendguard_db, DB_USER, DB_PASSWORD

# 5. Apply migrations
python manage.py migrate

# 6. Seed Product Bible v2.0 baseline data
python manage.py seed_data

# 7. Start Backend server
python manage.py runserver 8000
```

- **API Base URL**: `http://127.0.0.1:8000/api/v1/`
- **Swagger Documentation**: `http://127.0.0.1:8000/api/docs/`
- **Django Admin**: `http://127.0.0.1:8000/admin/`

---

### Frontend Setup (React SPA + Vite)

```bash
# 1. Navigate to Frontend directory
cd Frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

- **Web Application**: `http://localhost:5173/`

---

### 🧪 Running Tests

```bash
# Run automated backend unit tests (All engines, auth, and validations)
cd Backend
./venv/bin/python manage.py test apps.core apps.authentication apps.loans apps.payments apps.statements

# Verify frontend build
cd Frontend
npm run build
```

---

## 🔑 Demo Account Credentials
- **Username / Email**: `karthik` or `karthik@lendguard.io`
- **Password**: `Password123!`
- **Role**: Primary Lender (Admin)

---

## 📄 License
Proprietary — Developed for LendGuard.
