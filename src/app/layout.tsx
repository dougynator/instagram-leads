import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'IG Lead Scanner',
  description: 'Instagram lead filtering and scoring tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64">
              <div className="max-w-6xl mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
