import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RekapAI — Sales Intelligence',
  description: 'Rekap otomatis prospek dari export chat WhatsApp menggunakan Groq AI. Data disimpan ke database SQLite dengan skala prioritas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
