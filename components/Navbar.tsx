import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-dark-600 bg-dark-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-brand-400">Veri</span>
            <span className="text-white">fly</span>
          </span>
          <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-xs font-semibold text-brand-400">
            BETA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-400 md:flex">
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          {user && (
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          )}
        </nav>

        {/* Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-dark-600 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-brand-300">
                  {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span>{profile?.username}</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-dark-500 bg-dark-700 py-1 shadow-xl">
                  <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white" onClick={() => setDropOpen(false)}>Dashboard</Link>
                  <Link href={`/creator/${profile?.username}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white" onClick={() => setDropOpen(false)}>My Profile</Link>
                  <button onClick={handleSignOut} className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-500">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Log In</Link>
              <Link href="/signup" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-dark-900 hover:bg-brand-400 transition-colors">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-dark-600 bg-dark-800 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link href="/leaderboard" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
            <Link href="/#how-it-works" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>How It Works</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={handleSignOut} className="text-left text-red-400">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link href="/signup" className="text-brand-400 font-semibold" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
