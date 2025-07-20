import ClientProviders from '../../components/layout/ClientProviders';
import { NextIntlClientProvider } from 'next-intl';

// Import messages for translations
import { getMessages } from '../../messages/utils';
import NavbarWrapper from '../../components/layout/NavbarWrapper';

export default async function LocaleLayout({ children, params }) {
  const { locale = 'en' } = params; 
  const messages = await getMessages(locale);
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <ClientProviders>
        {/* NavbarWrapper will conditionally render the appropriate navbar */}
        <NavbarWrapper />
        <main className="container mx-auto px-4 py-0 flex-grow min-h-screen">
          {children}
        </main>
      </ClientProviders>
    </NextIntlClientProvider>
  );
}
