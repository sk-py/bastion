"use client";

import { ChevronsUpDown, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout, type CurrentUser } from "@/api/auth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
    },
  });
};

export function FooterMenu({ user }: { user: CurrentUser }) {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { mutate: handleLogout } = useLogout();

  const Logo = "/android-chrome-512x512.png";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                size="lg"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-background text-foreground">
              <img src={Logo} className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.name}
              </span>

              <span className="truncate text-xs">
                {user?.email}
              </span>
            </div>

            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="mb-4 w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "top"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Workspace
              </DropdownMenuLabel>

              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center bg-card justify-center rounded-sm border">
                  <img src={Logo} className="size-4 shrink-0" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {user?.workspaceName}
                  </span>

                  <span className="truncate capitalize text-xs text-muted-foreground">
                    {user?.role}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  {theme === "dark" ? (
                    <Sun className="size-4" color="#7D82FB" />
                  ) : (
                    <Moon className="size-4" color="#7D82FB" />
                  )}
                </div>

                <div className="font-medium">Toggle Theme</div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer text-red-500 focus:text-red-500"
                onClick={() => handleLogout()}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background text-inherit">
                  <LogOut className="size-3" color="red" />
                </div>

                <div className="font-medium">Log out</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}