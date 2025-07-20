import '../../../app/globals.css';

export const metadata = {
  title: 'Admin | EduSocial',
  description: 'Admin dashboard for EduSocial',
};

export default function AdminLayout({ children }) {

  return (
    <div className="container mx-auto p-4">
      {children}
    </div>
  );
} 