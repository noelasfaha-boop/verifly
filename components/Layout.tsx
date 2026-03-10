import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  noFooter?: boolean;
}

export default function Layout({
  children,
  title = 'Verifly — Verified Performance for Creators',
  description = 'Run paid communities and show verified trading or betting stats. Built for creators who want to prove their edge.',
  noFooter = false,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-dark-900 text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        {!noFooter && <Footer />}
      </div>
    </>
  );
}
