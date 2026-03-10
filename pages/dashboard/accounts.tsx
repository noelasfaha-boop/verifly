import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AccountLinkModal from '@/components/AccountLinkModal';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { TradingAccount } from '@/types';
import toast from 'react-hot-toast';

const PLATFORM_ICONS: Record<string, string> = {
  binance: '🟡',
  coinbase: '🔵',
  draftkings: '🟢',
  manual: '📝',
};

export default function AccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard/accounts');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    const supabase = getSupabase();
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', user!.id)
      .single();
    if (!creator) { router.replace('/dashboard'); return; }
    setCreatorId(creator.id);
    const { data } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });
    setAccounts(data ?? []);
  }

  async function handleSync(accountId: string) {
    setSyncing(accountId);
    try {
      const res = await fetch('/api/accounts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Synced ${data.imported} trades!`);
        await load();
      }
    } catch {
      toast.error('Sync failed.');
    } finally {
      setSyncing(null);
    }
  }

  async function handleUnlink(accountId: string) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('trading_accounts')
      .update({ is_active: false })
      .eq('id', accountId);
    if (!error) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast.success('Account unlinked.');
    }
  }

  return (
    <Layout title="Linked Accounts — Verifly" noFooter>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Linked Accounts</h1>
            <p className="text-sm text-gray-500">Connect trading platforms to auto-import and verify your stats.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-dark-900 hover:bg-brand-400 transition-colors"
          >
            + Link Account
          </button>
        </div>

        {/* Security notice */}
        <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
          <svg className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-300">Your keys are encrypted</p>
            <p className="text-xs text-blue-400/70">API keys are stored with AES-256 encryption. We only use read-only access — withdrawals are never possible.</p>
          </div>
        </div>

        {/* Accounts list */}
        <div className="mt-8 space-y-4">
          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-500 py-16 text-center">
              <p className="text-gray-600">No accounts linked yet.</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm font-semibold text-brand-400 hover:text-brand-300">
                Link your first account →
              </button>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-xl border border-dark-500 bg-dark-700 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{PLATFORM_ICONS[account.platform_name] ?? '🔗'}</span>
                  <div>
                    <p className="font-semibold capitalize text-white">{account.platform_name}</p>
                    <p className="text-xs text-gray-500">{account.account_identifier ?? 'Unnamed account'}</p>
                    {account.last_sync && (
                      <p className="text-xs text-gray-600">
                        Last synced: {new Date(account.last_sync).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.platform_name !== 'manual' && (
                    <button
                      onClick={() => handleSync(account.id)}
                      disabled={syncing === account.id}
                      className="rounded-lg border border-dark-400 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:border-dark-300 disabled:opacity-50 transition-colors"
                    >
                      {syncing === account.id ? 'Syncing…' : 'Sync Now'}
                    </button>
                  )}
                  <button
                    onClick={() => handleUnlink(account.id)}
                    className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && creatorId && (
        <AccountLinkModal
          creatorId={creatorId}
          onLinked={() => { setShowModal(false); load(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </Layout>
  );
}
