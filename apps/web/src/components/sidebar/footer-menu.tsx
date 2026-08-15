'use client';

import { ChevronsUpDown, Plus, LogOut, Sun, Moon } from 'lucide-react';
import * as React from 'react';
import { useTheme } from 'next-themes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/api/auth';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

type Team = {
  name: string;
  logo: string;
  plan: string;
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
    },
  });
};

export function FooterMenu({ teams }: { teams: Team[] }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  
  const { theme, setTheme } = useTheme();
  const { mutate: handleLogout } = useLogout();

  if (!activeTeam) return null;

  const Logo = '/android-chrome-512x512.png';

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
              <span className="truncate font-semibold">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.plan}</span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="mb-4 w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'top'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Workspaces
              </DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  className="gap-2 p-2"
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                >
                  <div className="flex size-6 items-center bg-card justify-center rounded-sm border">
                    <img src={team.logo} className="size-4 shrink-0" />
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" color='#7D82FB'  />
                </div>
                <div className="font-medium text-muted-foreground">Add Workspace</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="gap-2 p-2 cursor-pointer" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background ">
                  {theme === 'dark' ? <Sun className="size-4" color='#7D82FB' /> : <Moon className="size-4" color='#7D82FB' />}
                </div>
                <div className="font-medium">Toggle Theme</div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                className="gap-2 p-2 cursor-pointer text-red-500 focus:text-red-500" 
                onClick={() => handleLogout()}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background text-inherit">
                  <LogOut className="size-3" color='red' />
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