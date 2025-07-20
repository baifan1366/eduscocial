'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import AdminNavbar from './AdminNavbar';
import BusinessNavbar from './BusinessNavbar';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const isAdminPath = pathname?.includes('/admin');
  const isBusinessPath = pathname?.includes('/business');

  if (isAdminPath) {
    return <AdminNavbar />;
  }

  if(isBusinessPath){
    return <BusinessNavbar />;
  }
  
  // For non-admin paths, render the regular navbar
  return <Navbar />;
} 