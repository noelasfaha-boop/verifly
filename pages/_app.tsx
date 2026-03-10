import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#fff',
            border: '1px solid #2e2e42',
          },
          success: { iconTheme: { primary: '#00e878', secondary: '#0a0a0f' } },
        }}
      />
    </AuthProvider>
  );
}
