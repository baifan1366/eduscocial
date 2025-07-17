import '../globals.css';
import ClientProviders from '../../components/layout/ClientProviders';
import { NextIntlClientProvider } from 'next-intl';

// Import messages for translations
import { getMessages } from '../../messages/utils';
import NavbarWrapper from '../../components/layout/NavbarWrapper';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'EduSocial',
  description: 'Connect with students, share knowledge, and grow together.',
  openGraph: {
    title: 'EduSocial',
    images: ['/slogan-removebg-preview.png'],
  },
};

// Server-side current year calculation to avoid client/server mismatch
const currentYear = new Date().getFullYear();

export default async function RootLayout(props) {
  const { children, params } = props;
  const { locale = 'en' } = params; 
  const messages = await getMessages(locale);
  
  return (
    <html lang={locale} className="h-full">
      <body className="min-h-screen flex flex-col bg-[#0A1929] text-white">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <ClientProviders>
            {/* NavbarWrapper will conditionally render the appropriate navbar */}
            <NavbarWrapper />
            <main className="container mx-auto px-4 py-0 flex-grow min-h-screen">
              {children}
            </main>
            <footer
              className="bg-[#061120] py-6 px-4"
            >
              <div className="container mx-auto text-center text-gray-400">
                <p suppressHydrationWarning>© {currentYear} EduSocial. All rights reserved.</p>
              </div>
            </footer>
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
