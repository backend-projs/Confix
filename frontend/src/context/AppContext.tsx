'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';

interface AppContextType {
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
  selectedRole: string;
  setSelectedRole: (v: string) => void;
  lang: Lang;
  setLang: (v: Lang) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedRole, setSelectedRole] = useState('Holding Executive');
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('confix_company');
    if (saved) setSelectedCompany(saved);
    const savedRole = localStorage.getItem('confix_role');
    if (savedRole) setSelectedRole(savedRole);
    const savedLang = localStorage.getItem('confix_lang') as Lang | null;
    if (savedLang && ['en', 'ru', 'az'].includes(savedLang)) setLang(savedLang);
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

  return (
    <AppContext.Provider value={{ selectedCompany, setSelectedCompany, selectedRole, setSelectedRole, lang, setLang }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
