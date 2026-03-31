import type { Metadata } from 'next';
import { Electrolize } from 'next/font/google';

import { MantineProvider, Box } from '@mantine/core';
import { theme } from '../theme';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { CartProvider } from '@/contexts/CartContext';
import { CookieBanner } from '@/components/CookieBanner';
import { CartDrawer } from '@/components/CartDrawer';
import { Notifications } from '@mantine/notifications';
import Grainient from '@/components/Grainient';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';


import './globals.css';



const electrolize = Electrolize({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-electrolize',
});


export const metadata: Metadata = {
  title: '$erver | Streetwear Rio de Janeiro - Moda Urbana 021',
  description: 'A marca definitiva de Streetwear no Rio de Janeiro. Coleções exclusivas, cultura urbana e o lifestyle carioca em cada peça. $erver Store - Inteligência em Moda 021.',
  keywords: ['streetwear rio de janeiro', 'moda urbana rj', '021 lifestyle', 'loja de roupas rj', 'server store', 'hypebeast brasil'],
  openGraph: {
    title: '$erver | Streetwear Rio de Janeiro',
    description: 'A marca definitiva de Streetwear no Rio de Janeiro. Entre para o bando.',
    images: ['/og-image.jpg'],
    locale: 'pt-BR',
    type: 'website',
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>

      <head>
      </head>
      <body className={electrolize.variable}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, opacity: 0.45 }}>
          <Grainient />
        </div>

        <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
          <Notifications position="top-right" zIndex={3000} />
          <CartProvider>
            <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />


              <Box style={{ flex: 1 }}>
                {children}
              </Box>
              <Footer />
            </Box>
            <CartDrawer />
            <CookieBanner />
          </CartProvider>

        </MantineProvider>


      </body>
    </html>
  );
}
