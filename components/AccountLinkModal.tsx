import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  creatorId: string;
  onLinked: () => void;
  onClose: () => void;
}

type PlatformType = 'draftkings' | 'prizepicks' | 'underdog' | 'binance' | 'coinbase' | 'manual';
type AuthType = 'credentials' | 'apikey' | 'none';

const PLATFORMS: {
  id: PlatformType;
  label: string;
  icon: string;
  description: string;
  auth: AuthType;
  category: 'betting' | 'crypto' | 'manual';
}[] = [
  {
    id: 'draftkings',
    label: 'DraftKings',
    icon: '🏈',
    description: 'Log in with your DraftKings account to import bet history.',
    auth: 'credentials',
    category: 'betting',
  },
  {
    id: 'prizepicks',
    label: 'PrizePicks',
    icon: '🎯',
    description: 'Log in with your PrizePicks account to import pick history.',
    auth: 'credentials',
    category: 'betting',
  },
  {
    id: 'underdog',
    label: 'Underdog Fantasy',
    icon: '🐶',
    description: 'Log in with your Underdog account to import entry history.',
    auth: 'credentials',
    category: 'betting',
  },
  {
    id: 'binance',
    label: 'Binance',
    icon: '🟡',
    description: 'Connect via read-only API Key & Secret.',
    auth: 'apikey',
    category: 'crypto',
  },
  {
    id: 'coinbase',
    label: 'Coinbase',
    icon: '🔵',
    description: 'Connect via read-only API key.',
    auth: 'apikey',
    category: 'crypto',
  },
  {
    id: 'manual',
    label: 'Manual Entry',
    icon: '📝',
    description: 'Log trades manually without connecting an account.',
    auth: 'none',
    category: 'manual',
  },
];

export default function AccountLinkModal({ creatorId, onLinked, onClose }: Props) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selected, setSelected] = useState<(typeof PLATFORMS)[0] | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'betting' | 'crypto' | 'manual'>('betting');

  function selectPlatform(p: (typeof PLATFORMS)[0]) {
    setSelected(p);
    if (p.auth === 'none') {
      // manual — link directly
      handleManualLink();
      return;
    }
    setStep('configure');
  }

  async function handleManualLink() {
    toast.success('Manual entry enabled. Log trades from the Performance page.');
    onLinked();
  }

  async function handleConnect() {
    if (!selected) return;
    setLoading(true);

    try {
      if (selected.auth === 'credentials') {
        // Credential-based (betting platforms) — call scrape endpoint
        const toastId = toast.loading('Connecting and importing bets…');
        const res = await fetch('/api/accounts/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId,
            platform: selected.id,
            username,
            password,
          }),
        });
        const data = await res.json();
        toast.dismiss(toastId);

        if (data.error) {
          toast.error(data.error);
        } else {
          toast.success(`Connected! Imported ${data.imported} bets.`);
          onLinked();
        }
      } else {
        // API key (crypto exchanges) — encrypt and store
        const res = await fetch('/api/accounts/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId,
            platform: selected.id,
            apiKey,
            apiSecret,
            accountIdentifier: username || selected.label,
          }),
        });
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.success('Account linked!');
          onLinked();
        }
      }
    } catch {
      toast.error('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = PLATFORMS.filter((p) => p.category === activeCategory);
  const canSubmit = selected?.auth === 'credentials'
    ? username && password
    : selected?.auth === 'apikey'
    ? !!apiKey
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-dark-500 bg-dark-800 p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {step === 'select' ? 'Connect Account' : `Connect ${selected?.label}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step: select */}
        {step === 'select' && (
          <>
            {/* Category tabs */}
            <div className="mt-4 flex gap-2">
              {(['betting', 'crypto', 'manual'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand-500 text-dark-900'
                      : 'border border-dark-500 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPlatform(p)}
                  className="flex w-full items-start gap-3 rounded-xl border border-dark-500 bg-dark-700 p-4 text-left hover:border-brand-500/50 hover:bg-dark-600 transition-all"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: configure */}
        {step === 'configure' && selected && (
          <div className="mt-4 space-y-4">
            <button
              onClick={() => { setStep('select'); setUsername(''); setPassword(''); setApiKey(''); setApiSecret(''); }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Credential login (betting platforms) */}
            {selected.auth === 'credentials' && (
              <>
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
                  <p className="text-sm font-semibold text-brand-300">
                    {selected.icon} Log in with {selected.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your {selected.label} credentials. We use them only to import your bet history — they are never stored.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    {selected.id === 'draftkings' ? 'Email' : 'Email or Username'}
                  </label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="off"
                    className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* API key (crypto) */}
            {selected.auth === 'apikey' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your read-only API key"
                    className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                {selected.id === 'binance' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">API Secret</label>
                    <input
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Paste your API secret"
                      className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <div className="rounded-lg bg-yellow-500/10 p-3">
              <p className="text-xs text-yellow-400">
                🔒 {selected.auth === 'credentials'
                  ? 'Your credentials are used only once to pull your history and are never saved to our servers.'
                  : 'API keys are encrypted with AES-256. Read-only access only — withdrawals are impossible.'}
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={loading || !canSubmit}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Importing bets…' : `Connect ${selected.label}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
