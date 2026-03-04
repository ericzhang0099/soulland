import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from './providers';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { NotificationProvider } from './components/Notification';
import { CartProvider } from './hooks/useCart';
import { FavoritesProvider } from './hooks/useFavorites';
import { CompareProvider } from './hooks/useCompare';
import { TutorialProvider } from './hooks/useTutorial';
import { Tutorial } from './components/Tutorial';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GenLoop 3.0 - AI Gene Trading & Evolution',
  description: 'A platform for AI gene trading and evolution with blockchain technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Web3Provider>
          <NotificationProvider>
            <CartProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <TutorialProvider>
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <Tutorial />
                  </TutorialProvider>
                </CompareProvider>
              </FavoritesProvider>
            </CartProvider>
          </NotificationProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
