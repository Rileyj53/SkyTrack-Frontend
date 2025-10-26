import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        {/* Content removed - keeping empty sidebar structure */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
} 