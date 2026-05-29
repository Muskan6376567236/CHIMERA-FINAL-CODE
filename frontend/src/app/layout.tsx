import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CHIMERA — Autonomous BI Platform',
  description: 'AI-powered Business Intelligence Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0f8',
              border: '1px solid #2a2a3a',
              borderRadius: '10px',
            },
          }}
        />
      </body>
    </html>
  );
}
