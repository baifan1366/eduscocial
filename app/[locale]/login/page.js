import AuthForm from '../../../components/auth/AuthForm';

export const metadata = {
  title: 'Login to EduSocial',
  description: 'Login to EduSocial',
  openGraph: {
    title: 'Login to EduSocial',
    images: ['/slogan-removebg-preview.png'],
  },
};

export default function LoginPage() {
  return (
    <main>
      <div className="max-w-md mx-auto py-12">
        <AuthForm />
      </div>
    </main>
  );
}
