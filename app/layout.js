import './globals.css';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col bg-[#0A1929] text-white">
        {children}
        <footer className="bg-[#061120] py-6 px-4">
          <div className="container mx-auto text-center text-gray-400">
            <p suppressHydrationWarning>© {currentYear} EduSocial. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
