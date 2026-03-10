import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  creatorId: string;
  priceId?: string;
  price: number;
  isSubscribed?: boolean;
}

export default function SubscribeButton({ creatorId, priceId, price, isSubscribed }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!user) {
      router.push(`/login?next=/creator/${creatorId}`);
      return;
    }
    if (!priceId) {
      toast.error('Subscription not configured for this creator yet.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? 'Failed to start checkout.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-brand-500/10 px-5 py-3 text-sm font-semibold text-brand-400">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Subscribed
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Loading…' : `Subscribe — $${price.toFixed(2)}/mo`}
    </button>
  );
}
