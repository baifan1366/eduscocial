'use client';

import { usePathname } from "next/navigation";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
  } from "@/components/ui/menubar"
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function MenuBar() {
    const pathname = usePathname();
    const locale = useLocale();
    const isDashboard = pathname === `/${locale}/admin/dashboard`; 
    const isBoards = pathname === `/${locale}/admin/boards`;
    const shouldShowMenuBar = !pathname.includes("/admin/login") && !pathname.includes("/admin/forgot-password");
    const t = useTranslations('AdminDashboard');
    const router = useRouter();

    if (!shouldShowMenuBar) return null;

    return (
        <Menubar className="bg-transparent rounded-none border-none mt-2">
            <MenubarMenu>
                <MenubarTrigger
                    className={`border-t-0 border-x-0 rounded-none transition-colors
                        ${isDashboard ? "border-b-2 border-[#FF7D00] text-[#FF7D00]" : ""}
                        data-[state=open]:bg-[#FF7D00] data-[state=open]:text-white data-[state=open]:shadow-xs data-[state=open]:border-[#FF7D00]
                        focus:border-[#FF7D00] focus:bg-[#FF7D00] focus:text-white focus:shadow-xs
                        hover:bg-[#FF7D00] hover:border-[#FF7D00] hover:text-white hover:shadow-xs transition-colors`}
                >
                    {t('Dashboard')}
                </MenubarTrigger>
                <MenubarContent>
                <MenubarItem 
                    onClick={() => router.push(`/${locale}/admin/dashboard`)}
                >
                    {t('openDashboardPage')}
                </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger
                    className={`border-t-0 border-x-0 rounded-none transition-colors
                        ${isBoards ? "border-b-2 border-[#FF7D00] text-[#FF7D00]" : ""}
                        data-[state=open]:bg-[#FF7D00] data-[state=open]:text-white data-[state=open]:shadow-xs data-[state=open]:border-[#FF7D00]
                        focus:border-[#FF7D00] focus:bg-[#FF7D00] focus:text-white focus:shadow-xs
                        hover:bg-[#FF7D00] hover:border-[#FF7D00] hover:text-white hover:shadow-xs`}
                >
                    {t('Boards')}
                </MenubarTrigger>
                <MenubarContent>
                <MenubarItem 
                    onClick={() => router.push(`/${locale}/admin/boards`)}
                >
                    {t('openBoardsPage')}
                </MenubarItem>
                <MenubarItem>
                    {t('createNewBoard')} <MenubarShortcut>⌘T</MenubarShortcut>
                </MenubarItem>                
                <MenubarSeparator />
                <MenubarItem>{t('Share')}</MenubarItem>
                <MenubarItem>{t('Print')}</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}