import { ProfileForm } from '@/components/profile/profile-form';
import Head from 'next/head';

export default function ProfileEditPage() {
  return (
    <>
      <Head>
        <title>Card Self-Introduction - EduSocial</title>
        <meta name="description" content="Edit your card self-introduction and profile information" />
      </Head>
      
      <ProfileForm />
    </>
  );
}