'use client'

import { AppSidebar } from "@/components/business/layout/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import React from "react"

export default function BusinessSidebar({ children }) {

  // Get the current pathname
  const pathname = usePathname()
  
  // Extract segments after /business/
  const businessPathSegment = pathname.split("/business/")[1] || ""
  const segments = businessPathSegment ? businessPathSegment.split("/") : []
  
  // Format breadcrumb items - capitalize first letter and replace dashes with spaces
  const formattedSegments = segments.map((item) => {
    // Check if item is a UUID (skip it from breadcrumb display)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item)
    if (isUUID) return null
    
    return {
      original: item,
      formatted: item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, " ")
    }
  }).filter(Boolean) // Remove null items (UUIDs)

  const t = useTranslations("Business")

  // 创建面包屑项目和分隔符的数组
  const breadcrumbItems = []
  formattedSegments.forEach((segment, index) => {
    const isLastItem = index === formattedSegments.length - 1
    const href = `/business/${segments.slice(0, index + 1).join('/')}`
    
    // 添加面包屑项目
    breadcrumbItems.push(
      <BreadcrumbItem key={`item-${index}`}>
        {!isLastItem ? (
          <BreadcrumbLink href={href}>
            {t(segment.formatted)}
          </BreadcrumbLink>
        ) : (
          <BreadcrumbPage>
            {t(segment.formatted)}
          </BreadcrumbPage>
        )}
      </BreadcrumbItem>
    )
    
    // 如果不是最后一项，添加分隔符
    if (!isLastItem) {
      breadcrumbItems.push(<BreadcrumbSeparator key={`separator-${index}`} />)
    }
  })

  return (
    <div className="flex w-full">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-1">
            <header
              className="flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbItems.length > 0 ? breadcrumbItems : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {t("Business")}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="p-4">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
    </div>
  );
} 