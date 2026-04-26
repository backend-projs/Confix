'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
  selectedRole: string;
  setSelectedRole: (v: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedRole, setSelectedRole] = useState('Holding Executive');

  useEffect(() => {
    const saved = localStorage.getItem('confix_company');
    if (saved) setSelectedCompany(saved);
    const savedRole = localStorage.getItem('confix_role');
    if (savedRole) setSelectedRole(savedRole);
  }, []);

  useEffect(() => {
    localStorage.setItem('confix_company', selectedCompany);
  }, [selectedCompany]);

  useEffect(() => {
    localStorage.setItem('confix_role', selectedRole);
  }, [selectedRole]);

  return (
    <AppContext.Provider value={{ selectedCompany, setSelectedCompany, selectedRole, setSelectedRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
