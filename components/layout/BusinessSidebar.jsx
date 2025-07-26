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

export default function BusinessSidebar({ children }) {

  // Get the current pathname
  const pathname = usePathname()
  
  // Handle paths safely
  const businessPathSegment = pathname.split("/business/")[1] || ""
  const breadcrumb = businessPathSegment ? businessPathSegment.split("/") : []
  
  // Format breadcrumb items - capitalize first letter and replace dashes with spaces
  const breadcrumbItems = breadcrumb.map((item) => {
    return item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, " ")
  })
  
  // Define breadcrumb navigation logic
  const hasMultipleSegments = breadcrumb.length > 1
  const linkSegments = hasMultipleSegments ? breadcrumb.slice(0, -1).join("/") : breadcrumb[0] || ""
  const currentSegment = hasMultipleSegments ? breadcrumb.slice(-1)[0] : breadcrumb[0] || ""

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
                    {hasMultipleSegments && (
                      <>
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink href={`/business/${linkSegments}`}>
                            {breadcrumbItems[0]}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                      </>
                    )}
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {hasMultipleSegments ? breadcrumbItems[breadcrumbItems.length - 1] : breadcrumbItems[0] || "Business"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
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