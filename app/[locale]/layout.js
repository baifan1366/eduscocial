import '../globals.css';
import Navbar from '../../components/layout/Navbar';
import ClientProviders from '../../components/layout/ClientProviders';

// Import messages for translations
import { getMessages } from '../../messages/utils';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'EduSocial',
  description: 'Connect with students, share knowledge, and grow together.',
  openGraph: {
    title: 'EduSocial',
    images: ['/slogan-removebg-preview.png'],
  },
};

// 在服务器端计算当前年份，避免客户端与服务器端差异
const currentYear = new Date().getFullYear();

export default async function RootLayout(props) {
  const { children } = props;
  const { locale = 'en' } = await props.params; 
  const messages = await getMessages(locale);
  
  return (
    <html lang={locale} className="h-full">
      <body className="min-h-screen flex flex-col bg-[#0A1929] text-white">
        <ClientProviders locale={locale} messages={messages}>
          <Navbar />
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
      </body>
    </html>
  );
}
