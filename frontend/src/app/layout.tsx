import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Confix — Smart Field Reporting & Safety Operations',
  description: 'Infrastructure field reporting, risk assessment, and maintenance coordination platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="bg-[#0e0e1a] text-gray-100 min-h-screen">
        <AppProvider>
          <TopBar />
          <main className="px-3 py-4 sm:p-6 max-w-[1440px] mx-auto">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
