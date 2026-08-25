# Lendguard Backend API

Enterprise Lending, Risk Assessment & Loan Management REST API built with **Django 5** and **Django REST Framework (DRF)**.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (Tested with Python 3.14)
- `pip` & `venv`

### 2. Activate Virtual Environment

```bash
cd Backend

# Activate virtual environment
source venv/bin/activate       # On macOS/Linux
# venv\Scripts\activate        # On Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` if not already created:
```bash
cp .env.example .env
```

### 5. Apply Database Migrations
```bash
python manage.py migrate
```

### 6. Seed Development Data & Test Users
Populate the database with test accounts (admin, loan officer, risk analyst, borrower) and sample loan applications:
```bash
python manage.py seed_data
```

### 7. Start the Development Server
```bash
python manage.py runserver 8000
```
API is now live at `http://127.0.0.1:8000/`.

---

## 👥 Seeded Test Accounts

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin123!` | Administrator | Full admin access & Django Admin panel |
| `officer_sarah` | `Officer123!` | Loan Officer | Can review, approve, and assess risk |
| `analyst_david` | `Analyst123!` | Risk Analyst | Portfolio analysis & risk modeling |
| `borrower_alex` | `Borrower123!` | Borrower | Applied for business & personal loans |
| `borrower_elena` | `Borrower123!` | Borrower | Applied for mortgage & auto loans |

---

## 📖 Interactive API Documentation

Once the server is running, explore and test the endpoints via interactive docs:

- **Swagger UI**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **ReDoc**: [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **OpenAPI 3.0 Schema**: [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)
- **Django Admin**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 🛠️ REST API Endpoints Overview

### Health & System
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health/` | Service health status & metadata | No |

### Authentication (`/api/v1/auth/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | Register new user account | No |
| `POST` | `/api/v1/auth/login/` | Log in and receive Token | No |
| `POST` | `/api/v1/auth/logout/` | Invalidate current token | Yes (`Token <key>`) |
| `GET` | `/api/v1/auth/profile/` | Get current user profile & role | Yes (`Token <key>`) |

### Loans (`/api/v1/loans/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/loans/applications/` | List loan applications (filtered by user/role) | Yes |
| `POST` | `/api/v1/loans/applications/` | Create a new loan application draft | Yes |
| `GET` | `/api/v1/loans/applications/{id}/` | Get loan application details & monthly estimate | Yes |
| `POST` | `/api/v1/loans/applications/{id}/submit/` | Submit draft application for review | Yes |
| `POST` | `/api/v1/loans/applications/{id}/review/` | Approve / Reject loan with notes (Officers only) | Yes (Officer) |
| `GET` | `/api/v1/loans/applications/stats/` | Aggregated portfolio metrics & counts | Yes |

---

## 🧪 Running Unit Tests

Run the full automated test suite:
```bash
python manage.py test apps.core apps.authentication apps.loans
```

---

## 📁 Project Architecture

```
Backend/
├── venv/                       # Virtual environment
├── requirements.txt            # Python dependencies
├── .env.example / .env         # Environment configuration
├── .gitignore                  # Git ignore rules
├── manage.py                   # Django management script
├── lendguard_core/             # Core project configuration
│   ├── settings.py             # DRF, CORS, Auth, Database settings
│   ├── urls.py                 # Root URL router & Swagger schema
│   ├── wsgi.py
│   └── asgi.py
└── apps/                       # Modular business applications
    ├── core/                   # Health checks, management commands (seed_data)
    ├── authentication/         # User roles, Profile, Token Auth API
    └── loans/                  # Loan Applications, Amortization calculations, Review flows
```
