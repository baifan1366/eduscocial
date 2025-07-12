import '../globals.css';
import { use } from 'react';
import Navbar from '../../components/layout/Navbar';
import AuthProvider from '../../components/auth/AuthProvider';

export default function RootLayout({ children, params }) {
  const locale = use(params).locale || 'en';
  
  return (
    <html lang={locale}>
      <body
        className="bg-[#0A1929] text-white min-h-screen flex flex-col"
      >
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 flex-grow">
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
      </body>
    </html>
  );
}
