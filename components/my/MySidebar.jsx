'use client';

import { usePathnameContext } from '@/app/providers';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Hash, 
  Heart, 
  Users, 
  Crown, 
  Bookmark, 
  FileText, 
  Settings,
  Bell,
  Globe,
  Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function MySidebar() {
  const pathname = usePathnameContext();
  const { user } = useAuth();
  const router = useRouter();
  
  // Get the locale from the pathname
  const locale = pathname?.split('/')[1] || 'en';
  const baseUrl = `/${locale}`;
  
  // Handle navigation to settings
  const navigateToSettings = (tab) => {
    router.push(`${baseUrl}/my?settings=true${tab ? `&tab=${tab}` : ''}`, { scroll: false });
  };
  
  // Define navigation items based on the image
  const navItems = [
    {
      title: 'My Personal Wall',
      href: `${baseUrl}/my`,
      icon: <User className="w-5 h-5" />
    },
    {
      title: 'Topics I Follow',
      href: `${baseUrl}/my/topics`,
      icon: <Hash className="w-5 h-5" />
    },
    {
      title: 'Cards I Follow',
      href: `${baseUrl}/my/cards`,
      icon: <Heart className="w-5 h-5" />
    },
    {
      title: 'My Card Friends',
      href: `${baseUrl}/my/friends`,
      icon: <Users className="w-5 h-5" />
    },
    {
      title: 'My Achievements',
      href: `${baseUrl}/my/achievements`,
      icon: <Crown className="w-5 h-5" />
    },
    {
      title: 'My Bookmarks',
      href: `${baseUrl}/my/bookmarks`,
      icon: <Bookmark className="w-5 h-5" />
    },
    {
      title: 'Card Self-Introduction',
      href: `${baseUrl}/my/profile`,
      icon: <FileText className="w-5 h-5" />
    },
  ];
  
  // Check if current path matches nav item
  const isActivePath = (path) => {
    return pathname === path;
  };

  return (
      <Card className="bg-[#132F4C] shadow-md rounded-lg p-4 mb-6 w-full">
        <h2 className="font-bold mb-4 text-white">Personal Center</h2>
        <div className="space-y-2">
          {navItems.map((item, index) => (
            <Link 
              key={index}
              href={item.href}
              className={`
                inline-flex items-center gap-2 rounded-md text-sm font-medium 
                transition-all h-9 px-4 py-2 w-full justify-start
                ${isActivePath(item.href) 
                  ? 'bg-[#1E4976] text-white' 
                  : 'hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 text-gray-300'
                }
              `}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
          
          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md text-sm font-medium 
                transition-all h-9 px-4 py-2 w-full justify-start hover:bg-accent 
                hover:text-accent-foreground dark:bg-input/30 dark:border-input 
                dark:hover:bg-input/50 text-gray-300">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => navigateToSettings('general')}>
                <Bell className="h-4 w-4 mr-2" />
                General Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToSettings('preferences')}>
                <Globe className="h-4 w-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToSettings('security')}>
                <Shield className="h-4 w-4 mr-2" />
                Security
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
  );
} 