import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PeopleView } from './components/PeopleView';
import { LoansLedgerView } from './components/LoansLedgerView';
import { ReportsAgingView } from './components/ReportsAgingView';
import { LoanCalculatorView } from './components/LoanCalculatorView';
import { ApiExplorer } from './components/ApiExplorer';

import { NewLoanModal } from './components/NewLoanModal';
import { AddPersonModal } from './components/AddPersonModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { DigitalStatementModal } from './components/DigitalStatementModal';
import { AuthModal } from './components/AuthModal';

import { api } from './services/api';
import { ShieldCheck } from 'lucide-react';

// Initial Bible v2.0 mock data
const INITIAL_PEOPLE = [
  { id: 1, name: 'Rahul Sharma', relationship: 'colleague', mobile: '+91-9884401122', email: 'rahul.sharma@example.com', tags: 'work, emergency', total_lent: 50000, total_repaid: 20000, outstanding_balance: 30000, is_archived: false },
  { id: 2, name: 'Priya Patel', relationship: 'friend', mobile: '+91-9884403344', email: 'priya.patel@example.com', tags: 'close_friend', total_lent: 15000, total_repaid: 0, outstanding_balance: 15000, is_archived: false },
  { id: 3, name: 'Vikram Mehta', relationship: 'business', mobile: '+91-9884405566', email: 'vikram.mehta@example.com', tags: 'vendor, equipment', total_lent: 120000, total_repaid: 120000, outstanding_balance: 0, is_archived: false },
  { id: 4, name: 'Anita Desai', relationship: 'family', mobile: '+91-9884407788', email: 'anita.desai@example.com', tags: 'family, cousin', total_lent: 25000, total_repaid: 0, outstanding_balance: 25000, is_archived: false },
];

const INITIAL_LOANS = [
  {
    id: 1,
    loan_reference: 'LG-2026-0001',
    person: 1,
    person_name: 'Rahul Sharma',
    person_mobile: '+91-9884401122',
    person_relationship: 'colleague',
    principal_amount: 50000,
    currency: 'INR',
    date_given: '2026-08-01',
    due_date: '2026-09-10',
    purpose: 'Emergency home repair expenses',
    status: 'PARTIALLY_PAID',
    time_status: 'UPCOMING',
    days_overdue: 0,
    balance: { principal: 50000, total_repaid: 20000, outstanding: 30000, is_fully_paid: false },
    recent_payments: [{ id: 1, amount: 20000, payment_date: '2026-08-20', payment_method: 'upi_bank_transfer', reference_number: 'UPI/2026/894721' }]
  },
  {
    id: 2,
    loan_reference: 'LG-2026-0002',
    person: 2,
    person_name: 'Priya Patel',
    person_mobile: '+91-9884403344',
    person_relationship: 'friend',
    principal_amount: 15000,
    currency: 'INR',
    date_given: '2026-08-05',
    due_date: '2026-08-20',
    purpose: 'Exam certification fees',
    status: 'OPEN',
    time_status: 'OVERDUE',
    days_overdue: 5,
    balance: { principal: 15000, total_repaid: 0, outstanding: 15000, is_fully_paid: false },
    recent_payments: []
  },
  {
    id: 3,
    loan_reference: 'LG-2026-0003',
    person: 3,
    person_name: 'Vikram Mehta',
    person_mobile: '+91-9884405566',
    person_relationship: 'business',
    principal_amount: 120000,
    currency: 'INR',
    date_given: '2026-07-01',
    due_date: '2026-08-15',
    purpose: 'Advance raw materials procurement',
    status: 'PAID',
    time_status: 'PAID',
    days_overdue: 0,
    balance: { principal: 120000, total_repaid: 120000, outstanding: 0, is_fully_paid: true },
    recent_payments: [{ id: 2, amount: 120000, payment_date: '2026-08-14', payment_method: 'upi_bank_transfer', reference_number: 'NEFT/HDFC/0091823' }]
  },
  {
    id: 4,
    loan_reference: 'LG-2026-0004',
    person: 4,
    person_name: 'Anita Desai',
    person_mobile: '+91-9884407788',
    person_relationship: 'family',
    principal_amount: 25000,
    currency: 'INR',
    date_given: '2026-08-18',
    due_date: '2026-09-18',
    purpose: 'Medical treatment bridge loan',
    status: 'OPEN',
    time_status: 'DUE_SOON',
    days_overdue: 0,
    balance: { principal: 25000, total_repaid: 0, outstanding: 25000, is_fully_paid: false },
    recent_payments: []
  }
];

function LendGuardApp() {
  const { user, token, loading, backendOnline } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [loans, setLoans] = useState(INITIAL_LOANS);
  const [summary, setSummary] = useState(null);
  const [agingData, setAgingData] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Overdue Loan Alert', message: 'Loan #LG-2026-0002 to Priya Patel is 5 days overdue.', is_read: false },
    { id: 2, title: 'Repayment Received', message: 'Received ₹20,000 via UPI from Rahul Sharma.', is_read: true }
  ]);

  // Modals
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [newLoanPrefill, setNewLoanPrefill] = useState(null);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [selectedLoanForStatement, setSelectedLoanForStatement] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync data from Backend when authenticated
  const refreshData = async () => {
    if (!backendOnline || !token || !user) return;
    try {
      const [pRes, lRes, sRes, aRes, nRes] = await Promise.all([
        api.getPeople().catch(() => null),
        api.getLoans().catch(() => null),
        api.getDashboardSummary().catch(() => null),
        api.getAgingReport().catch(() => null),
        api.getNotifications().catch(() => null),
      ]);

      if (pRes) {
        const pList = pRes.results || pRes;
        if (Array.isArray(pList)) setPeople(pList);
      }
      if (lRes) {
        const lList = lRes.results || lRes;
        if (Array.isArray(lList)) setLoans(lList);
      }
      if (sRes) setSummary(sRes);
      if (aRes) setAgingData(aRes);
      if (nRes) {
        const nList = nRes.results || nRes;
        if (Array.isArray(nList)) setNotifications(nList);
      }
    } catch (e) {
      console.warn('Backend sync failed:', e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [backendOnline, token, user]);

  // 1. Loading Splash
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#060913',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)'
        }}>
          <ShieldCheck size={28} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Loading LendGuard Platform...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Dedicated Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Handlers
  const handleAddPerson = async (personData) => {
    if (backendOnline && token) {
      await api.createPerson(personData);
      await refreshData();
    } else {
      const newP = { id: Date.now(), ...personData, total_lent: 0, total_repaid: 0, outstanding_balance: 0 };
      setPeople([...people, newP]);
    }
  };

  const handleArchivePerson = async (id) => {
    if (backendOnline && token) {
      await api.archivePerson(id);
      await refreshData();
    } else {
      setPeople(people.map(p => p.id === id ? { ...p, is_archived: true } : p));
    }
  };

  const handleCreateLoan = async (loanData) => {
    if (backendOnline && token) {
      await api.createLoan(loanData);
      await refreshData();
    } else {
      const personObj = people.find(p => p.id === parseInt(loanData.person));
      const newL = {
        id: Date.now(),
        loan_reference: `LG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        person: loanData.person,
        person_name: personObj?.name || 'Contact',
        person_mobile: personObj?.mobile || '',
        person_relationship: personObj?.relationship || 'friend',
        principal_amount: loanData.principal_amount,
        currency: loanData.currency || 'INR',
        date_given: loanData.date_given,
        due_date: loanData.due_date,
        purpose: loanData.purpose,
        status: 'OPEN',
        time_status: 'UPCOMING',
        days_overdue: 0,
        balance: { principal: loanData.principal_amount, total_repaid: 0, outstanding: loanData.principal_amount, is_fully_paid: false },
        recent_payments: []
      };
      setLoans([newL, ...loans]);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    if (backendOnline && token) {
      await api.recordPayment(paymentData);
      await refreshData();
    } else {
      setLoans(loans.map(l => {
        if (l.id === paymentData.loan) {
          const currentRepaid = Number(l.balance?.total_repaid || 0);
          const newRepaid = currentRepaid + Number(paymentData.amount);
          const newOutstanding = Math.max(0, Number(l.principal_amount) - newRepaid);
          return {
            ...l,
            status: newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID',
            time_status: newOutstanding === 0 ? 'PAID' : l.time_status,
            balance: { ...l.balance, total_repaid: newRepaid, outstanding: newOutstanding, is_fully_paid: newOutstanding === 0 },
            recent_payments: [{ id: Date.now(), ...paymentData }, ...(l.recent_payments || [])]
          };
        }
        return l;
      }));
    }
  };

  const handleGenerateStatement = async (loan) => {
    setSelectedLoanForStatement(loan);
    if (backendOnline && token) {
      try {
        const stmt = await api.generateStatement(loan.id);
        setSelectedStatement(stmt);
      } catch (err) {
        console.warn('Could not generate statement from API, using client snapshot:', err);
        setSelectedStatement({
          statement_number: `STMT-${loan.loan_reference}-01`,
          sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          generated_at: new Date().toISOString(),
          canonical_data_snapshot: {
            lender: { full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username, email: user.email },
            borrower: { name: loan.person_name, mobile: loan.person_mobile, relationship: loan.person_relationship },
            financial_summary: {
              principal: loan.principal_amount,
              total_repaid: loan.balance?.total_repaid || 0,
              outstanding_balance: loan.balance?.outstanding || loan.principal_amount
            },
            repayment_ledger: loan.recent_payments || []
          }
        });
      }
    } else {
      setSelectedStatement({
        statement_number: `STMT-${loan.loan_reference}-01`,
        sha256_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        generated_at: new Date().toISOString(),
        canonical_data_snapshot: {
          lender: { full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username, email: user.email },
          borrower: { name: loan.person_name, mobile: loan.person_mobile, relationship: loan.person_relationship },
          financial_summary: {
            principal: loan.principal_amount,
            total_repaid: loan.balance?.total_repaid || 0,
            outstanding_balance: loan.balance?.outstanding || loan.principal_amount
          },
          repayment_ledger: loan.recent_payments || []
        }
      });
    }
    setIsStatementOpen(true);
  };

  const handleCancelLoan = async (id) => {
    if (backendOnline && token) {
      await api.cancelLoan(id);
      await refreshData();
    } else {
      setLoans(loans.map(l => l.id === id ? { ...l, status: 'CANCELLED' } : l));
    }
  };

  const handleWriteOffLoan = async (id) => {
    if (backendOnline && token) {
      await api.writeOffLoan(id);
      await refreshData();
    } else {
      setLoans(loans.map(l => l.id === id ? { ...l, status: 'WRITTEN_OFF' } : l));
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLoan={() => { setNewLoanPrefill(null); setIsNewLoanOpen(true); }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={(id) => setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))}
        onMarkAllNotificationsRead={() => setNotifications(notifications.map(n => ({ ...n, is_read: true })))}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            loans={loans}
            people={people}
            onRecordPaymentForLoan={(loan) => { setSelectedLoanForPayment(loan); setIsPaymentOpen(true); }}
            onGenerateStatement={handleGenerateStatement}
            onOpenNewLoan={() => { setNewLoanPrefill(null); setIsNewLoanOpen(true); }}
            onOpenAddPerson={() => setIsAddPersonOpen(true)}
          />
        )}

        {activeTab === 'people' && (
          <PeopleView
            people={people}
            onOpenAddPerson={() => setIsAddPersonOpen(true)}
            onLendToPerson={(p) => { setNewLoanPrefill({ person: p.id }); setIsNewLoanOpen(true); }}
            onArchivePerson={handleArchivePerson}
          />
        )}

        {activeTab === 'loans' && (
          <LoansLedgerView
            loans={loans}
            onOpenNewLoan={() => { setNewLoanPrefill(null); setIsNewLoanOpen(true); }}
            onRecordPayment={(loan) => { setSelectedLoanForPayment(loan); setIsPaymentOpen(true); }}
            onGenerateStatement={handleGenerateStatement}
            onCancelLoan={handleCancelLoan}
            onWriteOffLoan={handleWriteOffLoan}
          />
        )}

        {activeTab === 'aging' && (
          <ReportsAgingView
            agingData={agingData}
            loans={loans}
            onRecordPayment={(loan) => { setSelectedLoanForPayment(loan); setIsPaymentOpen(true); }}
            onGenerateStatement={handleGenerateStatement}
          />
        )}

        {activeTab === 'calculator' && (
          <div style={{ maxWidth: 940, margin: '0 auto' }}>
            <LoanCalculatorView
              onLendWithTerms={(terms) => {
                setNewLoanPrefill(terms);
                setIsNewLoanOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'api-explorer' && (
          <ApiExplorer />
        )}
      </main>

      {/* Modals */}
      <NewLoanModal
        isOpen={isNewLoanOpen}
        onClose={() => setIsNewLoanOpen(false)}
        people={people}
        onLoanCreated={handleCreateLoan}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        initialData={newLoanPrefill}
      />

      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onPersonAdded={handleAddPerson}
      />

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => { setIsPaymentOpen(false); setSelectedLoanForPayment(null); }}
        loan={selectedLoanForPayment}
        onPaymentRecorded={handleRecordPayment}
      />

      <DigitalStatementModal
        isOpen={isStatementOpen}
        onClose={() => { setIsStatementOpen(false); setSelectedStatement(null); }}
        statement={selectedStatement}
        loan={selectedLoanForStatement}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LendGuardApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
