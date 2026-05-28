import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora, Outfit, Inter, Bricolage_Grotesque } from 'next/font/google';
import { ReduxProvider } from '../store/provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin']
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin']
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: '--font-bricolage-grotesque',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'Generate high-quality structured school assessment papers in real-time with AI'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${inter.variable} ${geistSans.variable} ${geistMono.variable} ${lora.variable} ${bricolageGrotesque.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&display=swap"
          precedence="default"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}


