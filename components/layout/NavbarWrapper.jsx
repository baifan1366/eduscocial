'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const isAdminPath = pathname?.includes('/admin');
  
  if (isAdminPath) {
    // Don't render any navbar here as it's handled in the admin layout
    return null;
  }
  
  // For non-admin paths, render the regular navbar
  return <Navbar />;
} 