
import type {Metadata} from 'next';
import './globals.css';
import { Faustina, Roboto_Mono } from 'next/font/google';
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

const faustina = Faustina({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-faustina',
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caja.clancig.com.ar';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'FinanClan',
    template: '%s | FinanClan',
  },
  description: 'FinanClan: Tu gestor de finanzas personales para controlar ingresos y gastos fácilmente. Personaliza categorías y métodos de pago a tu medida. Toma el control de tu dinero con una app moderna y segura.',
  keywords: ['personal finance', 'expense tracker', 'income management', 'budgeting app', 'tax management', 'custom categories', 'payment methods', 'finanzas personales', 'gestor de gastos', 'ingresos y gastos', 'control de impuestos', 'categorías personalizadas', 'métodos de pago'],
  authors: [{ name: 'Clancig FullstackDev', url: 'https://clancig.com.ar' }],
  creator: 'Damián Clancig',
  publisher: 'Damián Clancig',
  
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: APP_URL,
    siteName: 'FinanClan',
    title: 'FinanClan - Tu Gestor de Finanzas Personales',
    description: 'Controla fácilmente tus ingresos y gastos. Personaliza categorías y métodos de pago. Toma el control de tu dinero con una app moderna y segura.',
    images: [
      {
        url: `${APP_URL}/og-image.webp`,
        width: 1200,
        height: 630,
        alt: 'FinanClan Dashboard mostrando totales financieros.',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FinanClan - Tu Gestor de Finanzas Personales',
    description: 'Controla fácilmente tus ingresos y gastos. Personaliza categorías y métodos de pago. Toma el control de tu dinero con una app moderna y segura.',
    images: [`${APP_URL}/og-image.webp`],
    creator: '@dclancig',
  },

  icons: {
    icon: `${APP_URL}/favicon.ico`,
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${faustina.variable} ${roboto_mono.variable}`}>
      <head />
      <body className="font-serif antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
