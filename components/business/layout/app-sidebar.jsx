"use client"

import * as React from "react"
import {
  Home,
  Megaphone,
  Users,
  BarChart2,
  FileText,
  Settings,
  PlusCircle,
  Bot,
  Ruler,
  Download,
  CreditCard,
  LayoutDashboard,
  Image,
  Target,
  Eye,
  DollarSign,
  BadgeDollarSign,
  BookOpenCheck,
  Gem,
  Package,
  GalleryVerticalEnd,
  PenToolIcon,
  HelpCircle,
} from "lucide-react"

import { NavMain } from "@/components/business/layout/nav-main"
import { NavShortcuts } from "@/components/business/layout/nav-shortcuts"
import { NavProducts } from "@/components/business/layout/nav-products"
import { NavUser } from "@/components/business/layout/nav-user"
import { CompanySettings } from "@/components/business/layout/company-settings"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useTranslations } from "next-intl"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  company: [
    {
      name: "EduSocial",
      logo: GalleryVerticalEnd,
      plan: "EduSocial",
      creditsLeft: 1000,
    }
  ],
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: Home,
    },
    {
      title: "Campaigns",
      url: "#",
      icon: Megaphone,
    },
    {
      title: "Audience",
      url: "#",
      icon: Users,
    },
    {
      title: "Reports",
      url: "#",
      icon: BarChart2,
    },
    {
      title: "Billing",
      url: "#",
      icon: FileText,
    },
  ],
  shortcuts: [
    {
      title: "Create Campaign",
      url: "#",
      icon: PlusCircle,
    },
    {
      title: "Generate Ad Copy (AI)",
      url: "#",
      icon: Bot,
    },
    {
      title: "Estimate Reach",
      url: "#",
      icon: Ruler ,
    },
    {
      title: "Download Reports",
      url: "#",
      icon: Download,
    },
    {
      title: "Add Credits",
      url: "#",
      icon: CreditCard,
    },
  ],
  products: [
    {
      title: "Advertising",
      url: "#",
      icon: Megaphone,
      items: [
        {
          title: "Manage Campaigns",
          url: "#",
          icon: LayoutDashboard	,
        },
        {
          title: "Ad Creatives",
          url: "#",
          icon: Image ,
        },
        {
          title: "Audience Targeting",
          url: "#",
          icon: Target,
        },
        {
          title: "Ad Preview",
          url: "#",
          icon: Eye,
        },
      ],
    },
    {
      title: "Payments & Credits",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Buy Credits",
          url: "#",
          icon: DollarSign,
        },
        {
          title: "Subscription Plans",
          url: "#",
          icon: BadgeDollarSign	,
        },
        {
          title: "Monthly Invoicing",
          url: "#",
          icon: FileText,
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: PenToolIcon,
      items: [
        {
          title: "AI Copy Generator",
          url: "#",
          icon: Bot,
        },
        {
          title: "Reach Estimator",
          url: "#",
          icon: Ruler	,
        },
        {
          title: "Setup Guide",
          url: "#",
          icon: HelpCircle,
        },
      ],
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const t = useTranslations("Business")
  return (
    (<Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CompanySettings company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavShortcuts shortcuts={data.shortcuts} />
        <NavProducts products={data.products} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>)
  );
}
