'use client';

import { ProfileProvider } from '@/contexts/profile-context';

export default function MyLayoutClient({ children }) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  );
}