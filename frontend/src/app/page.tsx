'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function Home() {
  const router = useRouter();
  const { user, loadingAuth } = useAppContext();
  useEffect(() => {
    if (loadingAuth) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, loadingAuth, router]);
  return null;
}
