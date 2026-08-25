const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Token helpers
export const getToken = () => localStorage.getItem('lendguard_token');
export const setToken = (token) => localStorage.setItem('lendguard_token', token);
export const removeToken = () => localStorage.removeItem('lendguard_token');

// Generic request handler
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    if (typeof data === 'string') {
      errorMsg = data;
    } else if (data.detail) {
      errorMsg = data.detail;
    } else if (data.error) {
      errorMsg = data.error;
    } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      errorMsg = data.non_field_errors.join(', ');
    } else if (typeof data === 'object' && Object.keys(data).length > 0) {
      const fieldErrors = Object.entries(data).map(([field, msgs]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
        const messageText = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        return `${fieldName}: ${messageText}`;
      });
      errorMsg = fieldErrors.join(' | ');
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // System Health
  checkHealth: () => request('/health/'),

  // Authentication
  login: (username, password) =>
    request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (userData) =>
    request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () =>
    request('/auth/logout/', {
      method: 'POST',
    }),

  getProfile: () => request('/auth/profile/'),

  updateProfile: (profileData) =>
    request('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  // Dashboard & Reports (Bible v2.0)
  getDashboardSummary: () => request('/dashboard/summary/'),
  getAgingReport: () => request('/reports/aging/'),

  // People / Contacts
  getPeople: (params = '') => request(`/people/${params ? `?${params}` : ''}`),
  createPerson: (personData) =>
    request('/people/', {
      method: 'POST',
      body: JSON.stringify(personData),
    }),
  archivePerson: (id) =>
    request(`/people/${id}/archive/`, {
      method: 'POST',
    }),
  unarchivePerson: (id) =>
    request(`/people/${id}/unarchive/`, {
      method: 'POST',
    }),

  // Lending Ledger / Loans
  getLoans: (params = '') => request(`/loans/${params ? `?${params}` : ''}`),
  getLoan: (id) => request(`/loans/${id}/`),
  createLoan: (loanData) =>
    request('/loans/', {
      method: 'POST',
      body: JSON.stringify(loanData),
    }),
  cancelLoan: (id) =>
    request(`/loans/${id}/cancel/`, {
      method: 'POST',
    }),
  writeOffLoan: (id) =>
    request(`/loans/${id}/write_off/`, {
      method: 'POST',
    }),
  getLoanLedger: (id) => request(`/loans/${id}/ledger/`),

  // Repayments / Payments
  getPayments: (params = '') => request(`/payments/${params ? `?${params}` : ''}`),
  recordPayment: (paymentData) =>
    request('/payments/', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  voidPayment: (id, voidReason) =>
    request(`/payments/${id}/void/`, {
      method: 'POST',
      body: JSON.stringify({ void_reason: voidReason }),
    }),

  // Reminders & Notifications
  getReminders: () => request('/reminders/schedules/'),
  getNotifications: () => request('/reminders/alerts/'),
  markNotificationRead: (id) =>
    request(`/reminders/alerts/${id}/mark_read/`, {
      method: 'POST',
    }),
  markAllNotificationsRead: () =>
    request('/reminders/alerts/mark_all_read/', {
      method: 'POST',
    }),

  // Digital Statement & IOU
  getStatements: () => request('/statements/'),
  generateStatement: (loanId) =>
    request('/statements/generate/', {
      method: 'POST',
      body: JSON.stringify({ loan_id: loanId }),
    }),

  // Data Management, Backup & Export (Screen P27)
  exportData: () => request('/data/export/'),
  purgeData: () =>
    request('/data/purge/', {
      method: 'POST',
    }),
};
