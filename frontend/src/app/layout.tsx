import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
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
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
