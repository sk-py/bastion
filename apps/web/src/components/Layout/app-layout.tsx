import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Outlet } from "react-router"
import { AppSidebar } from "../sidebar/app-sidebar"
import { Button } from "../ui/button"

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Button
          variant="outline"
          size="icon"
          className={"cursor-pointer m-4 bg-white/10 backdrop-blur-sm  md:hidden"}
        >
          <SidebarTrigger className={"cursor-pointer"} />
        </Button>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}