import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { SpaceBackground } from '@/components/layout/SpaceBackground';
import { Header } from '@/components/layout/Header';
import { SoundProvider } from '@/components/audio/SoundProvider';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SG Math Pal - Space Math Adventure',
  description: 'A gamified math study partner for young mathematicians in Singapore',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${nunito.variable} antialiased min-h-screen bg-space-bg text-white`}>
        <SoundProvider>
          <SpaceBackground />
          <Header />
          <main className="relative z-10">
            {children}
          </main>
        </SoundProvider>
      </body>
    </html>
  );
}
