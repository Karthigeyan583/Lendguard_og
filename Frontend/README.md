# Lendguard Frontend

Modern, high-performance React frontend interface for the **Lendguard** lending, risk evaluation, and loan management platform.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd Frontend
npm install
```

### 2. Configure API Endpoint
Default API target is `http://127.0.0.1:8000/api/v1`. To customize, create a `.env` file:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The Vite development server will launch at `http://localhost:5173/`.

---

## ✨ Features Included

1. **Fintech Design System**: Midnight slate dark theme with glassmorphism, responsive cards, status pill badges, and custom styled range sliders.
2. **Real-Time Loan Amortization Calculator**: Interactive sliders for loan principal, repayment period (months), and annual interest rate (APR) with live payment breakdown.
3. **Role-Based Workflows**:
   - **Borrowers**: Apply for loans, track status (`draft`, `submitted`, `under_review`, `approved`), view monthly amortization schedules.
   - **Loan Officers / Risk Analysts**: Review submitted applications, assign underwriting risk scores, add notes, and approve/reject applications.
4. **Quick 1-Click Profile Switcher**: Instantly switch between test users (`Alex Morgan` - Borrower, `Sarah Jenkins` - Loan Officer, `David Vance` - Risk Analyst, `Admin`).
5. **Interactive API Explorer & Swagger Portal**: Direct links to Swagger UI (`/api/docs/`), ReDoc (`/api/redoc/`), and live `/api/v1/health/` connection testing.
6. **Zero-Blocker Offline Mode**: If the Django backend is not yet started, the UI automatically uses mock data so you can test all views and flows immediately.

---

## 🏗️ Architecture

```
Frontend/
├── index.html                  # HTML entry point with Google Fonts
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                # Application root
    ├── App.jsx                 # Main layout, state coordination, and tab routing
    ├── index.css               # Design system & CSS custom properties
    ├── context/
    │   └── AuthContext.jsx     # Authentication state, token storage, and demo roles
    ├── services/
    │   └── api.js              # Centralized Django REST API client
    └── components/
        ├── Navbar.jsx          # Header navigation, backend health badge, role switcher
        ├── StatsCards.jsx      # Financial KPI metric cards
        ├── LoanCalculator.jsx  # Amortization calculation widget
        ├── LoanList.jsx        # Applications table/cards with status filtering
        ├── NewLoanModal.jsx    # Loan origination application modal
        ├── ReviewModal.jsx     # Loan underwriting decision modal
        ├── AuthModal.jsx       # User login & registration modal
        └── ApiExplorer.jsx     # Registered endpoints & documentation links
```
