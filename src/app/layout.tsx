import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Meta Ads Pro — Analizador de Campañas',
  description: 'Dashboard profesional para analizar y optimizar campañas de Meta Ads',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased dark`}>
      <body className="h-full bg-[#0a0a0a] text-white">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 ml-60 flex flex-col h-full overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
