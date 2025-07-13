import AuthForm from '../../../components/auth/AuthForm';

export const metadata = {
  title: 'Register to EduSocial',
  description: 'Create your EduSocial account',
  openGraph: {
    title: 'Register to EduSocial',
    images: ['/slogan-removebg-preview.png'],
  },
};

export default function RegisterPage() {
  return (
    <main>
      <div className="max-w-md mx-auto py-12">
        <AuthForm isRegister={true} />
      </div>
    </main>
  );
}
