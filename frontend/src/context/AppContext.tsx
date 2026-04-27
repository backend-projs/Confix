'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';
import type { User } from '@/lib/auth-api';
import { login as apiLogin, fetchMe } from '@/lib/auth-api';

export type Theme = 'light' | 'dark';

interface AppContextType {
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
  selectedRole: string;
  setSelectedRole: (v: string) => void;
  lang: Lang;
  setLang: (v: Lang) => void;
  theme: Theme;
  setTheme: (v: Theme) => void;
  toggleTheme: () => void;
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  loadingAuth: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedRole, setSelectedRole] = useState('Holding Executive');
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('confix_company');
    if (saved) setSelectedCompany(saved);
    const savedRole = localStorage.getItem('confix_role');
    if (savedRole) setSelectedRole(savedRole);
    const savedLang = localStorage.getItem('confix_lang') as Lang | null;
    if (savedLang && ['en', 'ru', 'az'].includes(savedLang)) setLang(savedLang);
    const savedTheme = localStorage.getItem('confix_theme') as Theme | null;
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) setTheme(savedTheme);

    const savedToken = localStorage.getItem('confix_token');
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken)
        .then(({ user: u }) => {
          setUser(u);
          setSelectedRole(u.role === 'superadmin' ? 'Holding Executive' : u.role === 'admin' ? 'Company Admin' : u.position || 'Field Engineer');
          if (u.company_id) setSelectedCompany(u.company_id);
        })
        .catch(() => {
          localStorage.removeItem('confix_token');
          setToken(null);
        })
        .finally(() => setLoadingAuth(false));
    } else {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('confix_company', selectedCompany);
  }, [selectedCompany]);

  useEffect(() => {
    localStorage.setItem('confix_role', selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    localStorage.setItem('confix_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('confix_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const handleLogin = async (identifier: string, password: string) => {
    const payload = await apiLogin(identifier, password);
    setUser(payload.user);
    setToken(payload.token);
    localStorage.setItem('confix_token', payload.token);
    setSelectedRole(payload.user.role === 'superadmin' ? 'Holding Executive' : payload.user.role === 'admin' ? 'Company Admin' : payload.user.position || 'Field Engineer');
    if (payload.user.company_id) setSelectedCompany(payload.user.company_id);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('confix_token');
  };

  return (
    <AppContext.Provider value={{
      selectedCompany, setSelectedCompany,
      selectedRole, setSelectedRole,
      lang, setLang,
      theme, setTheme, toggleTheme,
      user, token, login: handleLogin, logout: handleLogout, loadingAuth,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
