import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-dark-600 bg-dark-900 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold">
              <span className="text-brand-400">Veri</span>
              <span className="text-white">fly</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Verified performance for creators. Build trust. Grow your community.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Become a Creator</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Connect</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li><a href="https://discord.gg/verifly" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Discord</a></li>
              <li><a href="https://twitter.com/verifly" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter / X</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-dark-600 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Verifly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
