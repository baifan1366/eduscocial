import '../../../app/globals.css';

export const metadata = {
  title: 'Business | EduSocial',
  description: 'Business portal for EduSocial',
};

export default async function BusinessLayout({ children }) {

  return (
    <div className="container mx-auto p-4">
      {children}
    </div>
  );
} 