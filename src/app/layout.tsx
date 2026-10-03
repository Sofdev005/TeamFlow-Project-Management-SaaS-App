import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';

const outfit = localFont({
  src: '../../public/fonts/Outfit-Variable.woff2',
  weight: '100 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TeamFlow',
  description: 'Multi-tenant project & task management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>
          <UserPreferencesProvider>{children}</UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
