import '../globals.css';
import Navbar from '../../components/layout/Navbar';
import AuthProvider from '../../components/auth/AuthProvider';
import { NextIntlClientProvider } from 'next-intl';

// Import messages for translations
import { getMessages } from '../../messages/utils';

export default async function RootLayout(props) {
  const { children } = props;
  const { locale = 'en' } = await props.params; 

  const messages = await getMessages(locale);
  
  return (
    <html lang={locale}>
      <body
        className="bg-[#0A1929] text-white min-h-screen flex flex-col"
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-0 flex-grow">
              {children}
            </main>
            <footer
              className="bg-[#061120] py-6 px-4"
            >
              <div className="container mx-auto text-center text-gray-400">
                <p>© {new Date().getFullYear()} EduSocial. All rights reserved.</p>
              </div>
            </footer>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
