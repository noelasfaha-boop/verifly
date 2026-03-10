import Link from 'next/link';
import Layout from '@/components/Layout';

export default function NotFoundPage() {
  return (
    <Layout title="404 — Verifly" noFooter>
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
        <p className="text-8xl font-black text-brand-500/20">404</p>
        <h1 className="mt-4 text-2xl font-black text-white">Page Not Found</h1>
        <p className="mt-2 text-gray-500">This page doesn&apos;t exist or was moved.</p>
        <Link href="/" className="mt-8 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-dark-900 hover:bg-brand-400 transition-colors">
          Back to Home
        </Link>
      </div>
    </Layout>
  );
}
