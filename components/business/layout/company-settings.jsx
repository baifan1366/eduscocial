"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Coins, FileText, Plus, Settings, Gem, Package } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function CompanySettings({
  company
}) {
  const { isMobile } = useSidebar()
  const [activeCompany, setActiveCompany] = React.useState(company[0])
  const [isOpen, setIsOpen] = React.useState(false)
  const t = useTranslations("Business")
  const handleOpenChange = (open) => {
    setIsOpen(open)
  }

  if (!activeCompany) {
    return null
  }

  return (
    (<SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 ease-in-out",
                isOpen && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}>
              <div
                className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg transition-transform duration-200 ease-in-out">
                <activeCompany.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCompany.name}</span>
                <span className="truncate text-xs">{activeCompany.plan}</span>
              </div>
              <div className={cn("ml-auto transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")}>
                <ChevronDown className="size-4" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="min-w-64 animate-in slide-in-from-top-5 fade-in-50 duration-200">
            <DropdownMenuItem className="flex flex-col items-center justify-center p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200">
                ES
              </div>
              <div className="mt-2 text-center">
                <p className="font-medium">EduSocial sandbox</p>
                <p className="text-sm text-muted-foreground">EduSocial</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Package />
                  <div className="flex flex-row justify-between w-full">
                    <span>{t("currentPlan")}</span>
                    <span className="text-muted-foreground">{t(activeCompany.plan)}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Gem />
                  <div className="flex flex-row justify-between w-full">
                    <span>{t("creditsLeft")}</span>
                    <span className="text-muted-foreground">{activeCompany.creditsLeft}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <FileText />
                  {t("billing")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  {t("settings")}
                </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>)
  );
}
