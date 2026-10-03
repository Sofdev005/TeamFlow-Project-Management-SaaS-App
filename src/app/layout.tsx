import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';

export const metadata: Metadata = {
  title: 'TeamFlow',
  description: 'Multi-tenant project & task management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <UserPreferencesProvider>{children}</UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
