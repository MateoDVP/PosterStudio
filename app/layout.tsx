import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Provider } from '@/components/ui/provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PosterStudio | Generador de Pósters Musicales 300 DPI',
  description: 'Herramienta profesional de preprensa digital para pósters minimalistas de álbumes y canciones a 300 DPI reales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
