
import type {Metadata} from 'next';
import './globals.css';
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Toaster } from '@/components/ui/toaster';

const APP_URL = 'https://caja.clancig.com.ar';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Ledger Lite',
    template: '%s | Ledger Lite',
  },
  description: 'Ledger Lite: Your personal finance manager to easily track income, expenses, and taxes. Take control of your money with a modern and secure app.',
  keywords: ['personal finance', 'expense tracker', 'income management', 'budgeting app', 'tax management', 'finanzas personales', 'gestor de gastos', 'ingresos y gastos', 'control de impuestos'],
  authors: [{ name: 'The Ledger Lite Authors', url: 'https://github.com/damianclancig/ledger-lite' }],
  creator: 'The Ledger Lite Authors',
  publisher: 'The Ledger Lite Authors',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'Ledger Lite',
    title: 'Ledger Lite - Personal Finance Manager',
    description: 'Easily track income, expenses, and taxes. Take control of your money with a modern and secure app.',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Ledger Lite Dashboard showing financial totals.',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Ledger Lite - Personal Finance Manager',
    description: 'Easily track income, expenses, and taxes. Take control of your money with a modern and secure app.',
    images: [`${APP_URL}/og-image.png`],
  },

  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
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
  
  manifest: `${APP_URL}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Faustina:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
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
      </body>
    </html>
  );
}
