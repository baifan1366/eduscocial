'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Sidebar({ isAuthenticated }) {
  const t = useTranslations('HomePage');
  
  return (
    <div className="space-y-4">
      {isAuthenticated ? (
        <>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">My Topics</h3>
            <ul className="space-y-1">
              <li><Link href="/my/topics" className="text-[#FF7D00] hover:underline">View all topics</Link></li>
            </ul>
          </div>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">My Cards</h3>
            <Link href="/my/cards" className="text-[#FF7D00] hover:underline">Create new card</Link>
          </div>
        </>
      ) : (
        <div className="bg-[#132F4C] rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-white">Join EduSocial</h3>
          <p className="mb-4 text-gray-300">Sign in to see personalized content and connect with your school community</p>
          <div className="space-x-2">
            <Link href="/login" className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors">
              Login
            </Link>
            <Link href="/register" className="border border-[#FF7D00] text-[#FF7D00] px-4 py-2 rounded-md hover:bg-[#FF7D00]/10 transition-colors">
              Register
            </Link>
          </div>
        </div>
      )}
      <div className="bg-[#132F4C] rounded-lg p-4">
        <h3 className="font-bold text-lg mb-2 text-white">Trending Topics</h3>
        <ul className="space-y-1 text-gray-300">
          <li><Link href="/topic/academic" className="hover:text-[#FF7D00]">Academic</Link></li>
          <li><Link href="/topic/campus-life" className="hover:text-[#FF7D00]">Campus Life</Link></li>
          <li><Link href="/topic/career" className="hover:text-[#FF7D00]">Career</Link></li>
        </ul>
      </div>
    </div>
  );
} 