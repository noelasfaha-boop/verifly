import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { creator } = router.query;

  return (
    <Layout title="Subscribed! — Verifly" noFooter>
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/20">
            <svg className="h-10 w-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-black text-white">You&apos;re In!</h1>
          <p className="mt-3 text-gray-400">
            Your subscription is now active. You&apos;ll get access to all premium signals and alerts.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {creator && (
              <Link
                href={`/creator/${creator}`}
                className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-dark-900 hover:bg-brand-400 transition-colors"
              >
                View Creator Profile →
              </Link>
            )}
            <Link
              href="/dashboard"
              className="rounded-xl border border-dark-400 px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
