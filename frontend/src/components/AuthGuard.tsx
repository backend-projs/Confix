'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register-company'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublic(pathname);

  useEffect(() => {
    if (loadingAuth) return;
    if (!user && !publicRoute) {
      router.replace('/login');
    }
    if (user && publicRoute) {
      router.replace('/dashboard');
    }
  }, [user, loadingAuth, publicRoute, router]);

  // While auth state is resolving, show a lightweight splash (don't show app shell)
  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-purple-600 dark:text-purple-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  // If not authenticated and on a protected page, render nothing while redirect happens
  if (!user && !publicRoute) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 dark:text-slate-500 text-sm">
        Redirecting to sign in...
      </div>
    );
  }

  return <>{children}</>;
}
