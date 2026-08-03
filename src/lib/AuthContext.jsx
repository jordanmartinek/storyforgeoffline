import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await base44.auth.currentUser();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login({ email, password }) {
    const u = await base44.auth.login({ email });
    setUser(u);
    return u;
  }

  async function register({ email, password }) {
    const u = await base44.auth.register({ email });
    setUser(u);
    return u;
  }

  async function logout() {
    await base44.auth.logout();
    setUser(null);
  }

  function navigateToLogin() {
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, navigateToLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
