'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import AdminNavbar from './AdminNavbar';
import BusinessNavbar from './BusinessNavbar';
import { useBusinessAuth } from './ClientProviders';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const isAdminPath = pathname?.includes('/admin');
  const isBusinessPath = pathname?.includes('/business');
  const { isBusinessAuthenticated } = useBusinessAuth();

  if (isAdminPath) {
    return <AdminNavbar />;
  }

  if(isBusinessPath){
    if(!isBusinessAuthenticated){
      return <BusinessNavbar />;
    }
    return null;
  }
  
  // For non-admin paths, render the regular navbar
  return <Navbar />;
} 