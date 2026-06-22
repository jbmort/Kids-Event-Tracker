import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kid-Friendly Body Journal',
  description: 'A fun and easy way to track daily habits!',
  manifest: "/manifest.json",

    appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Habits",
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} text-slate-900`} style={
        {
          backgroundColor:'#f7f9fc' 
        }
      }>
       
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}