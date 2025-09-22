// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Railway QR Code Generator',
  description: 'Professional QR code generator for railway parts management',
  keywords: 'railway, QR code, parts management, generator',
  authors: [{ name: 'Railway QR Generator' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}