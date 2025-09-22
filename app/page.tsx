// app/page.tsx
import RailwayQRGenerator from '@/components/RailwayQRGenerator';
import { Toaster } from 'sonner';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <RailwayQRGenerator />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e2e8f0',
          },
        }} 
      />
    </main>
  );
}