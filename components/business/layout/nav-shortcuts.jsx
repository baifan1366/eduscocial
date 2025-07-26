"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useTranslations } from "next-intl"

export function NavShortcuts({
  shortcuts = []
}) {
  const t = useTranslations("Business")
  return (
    (<SidebarGroup>
      <SidebarGroupLabel>{t("shortcuts")}</SidebarGroupLabel>
      <SidebarMenu>
        {shortcuts?.map((item) => (
          <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={t(item.title)}>
                {item.icon && <item.icon />}
                <span className="text-sm font-medium text-muted-foreground">{t(item.title)}</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>)
  );
}