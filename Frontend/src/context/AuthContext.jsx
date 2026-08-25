import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, removeToken, getToken } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { username: 'karthik', name: 'Karthik Ramaswamy', email: 'karthik@lendguard.io', role: 'admin', roleLabel: 'Primary Lender', password: 'Password123!' },
  { username: 'officer_sarah', name: 'Sarah Jenkins', email: 'sarah@lendguard.io', role: 'loan_officer', roleLabel: 'Loan Officer', password: 'Password123!' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  // Check health and existing session token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await api.checkHealth();
        setBackendOnline(true);

        const currentToken = getToken();
        if (currentToken) {
          try {
            const profile = await api.getProfile();
            setUser(profile);
          } catch (e) {
            console.warn('Session expired or invalid token, clearing session:', e);
            removeToken();
            setAuthToken(null);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Backend server check:', err);
        setBackendOnline(false);
        // Do not auto-login if no token exists
        const currentToken = getToken();
        if (!currentToken) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loginAsDemo = async (demoAccount) => {
    if (backendOnline) {
      return await login(demoAccount.username, demoAccount.password);
    } else {
      // Offline fallback login
      const mockUser = {
        id: 1,
        username: demoAccount.username,
        first_name: demoAccount.name.split(' ')[0],
        last_name: demoAccount.name.split(' ')[1] || '',
        email: demoAccount.email,
        profile: {
          role: demoAccount.role,
          is_kyc_verified: true,
          phone_number: '+91-9884409190'
        }
      };
      setToken('mock_demo_token');
      setAuthToken('mock_demo_token');
      setUser(mockUser);
      return { success: true, user: mockUser };
    }
  };

  const register = async (formData) => {
    try {
      const data = await api.register(formData);
      // Explicit requirement: do not auto-login upon signup.
      // Direct user to Sign In screen to authenticate with their credentials.
      return { 
        success: true, 
        message: data.message || 'Account created successfully! Please sign in with your credentials.',
        registeredUsername: formData.username
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      if (backendOnline && token) {
        await api.logout();
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      removeToken();
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        backendOnline,
        setBackendOnline,
        login,
        loginAsDemo,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
