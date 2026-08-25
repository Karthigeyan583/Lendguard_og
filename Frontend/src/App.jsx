import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { PeopleView } from './components/PeopleView';
import { LoansLedgerView } from './components/LoansLedgerView';
import { ReportsAgingView } from './components/ReportsAgingView';
import { LoanCalculatorView } from './components/LoanCalculatorView';
import { ApiExplorer } from './components/ApiExplorer';
import { SettingsView } from './components/SettingsView';

import { NewLoanModal } from './components/NewLoanModal';
import { AddPersonModal } from './components/AddPersonModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { DigitalStatementModal } from './components/DigitalStatementModal';
import { AuthModal } from './components/AuthModal';

import { api } from './services/api';
import { ShieldCheck } from 'lucide-react';

function LendGuardApp() {
  const { user, token, loading, backendOnline } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [people, setPeople] = useState([]);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [agingData, setAgingData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

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

  // Sync data strictly from Backend
  const refreshData = async () => {
    if (!backendOnline || !token || !user) return;
    setDataLoading(true);
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
      console.warn('Backend sync error:', e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      refreshData();
    } else {
      setPeople([]);
      setLoans([]);
      setSummary(null);
      setAgingData(null);
      setNotifications([]);
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

  const handleMarkNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (backendOnline && token) {
      try {
        await api.markNotificationRead(id);
      } catch (e) {
        console.warn('Failed to mark notification read on backend:', e);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (backendOnline && token) {
      try {
        await api.markAllNotificationsRead();
      } catch (e) {
        console.warn('Failed to mark all notifications read on backend:', e);
      }
    }
  };

  const overdueTotalCount = summary?.overdue_count ?? loans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF').length;

  return (
    <div className="saas-layout">
      {/* 1. Left SaaS Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLoan={() => { setNewLoanPrefill(null); setIsNewLoanOpen(true); }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        overdueCount={overdueTotalCount}
      />

      {/* 2. Main Viewport */}
      <div className="main-viewport">
        <TopHeader
          activeTab={activeTab}
          onOpenNewLoan={() => { setNewLoanPrefill(null); setIsNewLoanOpen(true); }}
          onOpenAddPerson={() => setIsAddPersonOpen(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        />

        <main className="content-area">
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

          {activeTab === 'settings' && (
            <SettingsView onDataPurged={refreshData} />
          )}
        </main>
      </div>

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
