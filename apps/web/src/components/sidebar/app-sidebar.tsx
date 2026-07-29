'use client';

import { motion } from 'motion/react';
import {
  Activity,
  DollarSign,
  Home,
  Infinity,
  LinkIcon,
  Moon,
  Package2,
  Percent,
  PieChart,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { appRoutes, type Route } from './sidebar-routes';
import { TeamSwitcher } from './team-switcher';
import DashboardNavigation from './sidebar-menu';
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';


const teams = [
  { id: '1', name: 'Alpha Inc.', logo: "./android-chrome-512x512.png", plan: 'Free' },
  { id: '2', name: 'Beta Corp.', logo: "./android-chrome-512x512.png", plan: 'Free' },
  { id: '3', name: 'Gamma Tech', logo: "./android-chrome-512x512.png", plan: 'Free' },
];

export function AppSidebar() {
  const { state, setOpen, open } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { theme, setTheme } = useTheme();




  return (
    <Sidebar collapsible="icon" className={cn(
      !open && "cursor-e-resize"
    )} variant="inset">
      <div
        className="h-full flex flex-col"
        onClick={() => {
          if (!open) setOpen(true);
        }}
      >
        <SidebarHeader
          className={cn(
            'flex md:pt-3.5',
            isCollapsed
              ? 'flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start'
              : 'flex-row items-center justify-between'
          )}
        >
          <a className="flex items-center gap-2" href="#">
            <img src='./android-chrome-512x512.png' className='object-contain size-12' />
          </a>

          <motion.div
            animate={{ opacity: 1 }}
            className={cn(
              'flex items-center gap-2',
              isCollapsed ? 'flex-row md:flex-col-reverse hidden' : 'flex-row'
            )}
            initial={{ opacity: 0 }}
            key={isCollapsed ? 'header-collapsed' : 'header-expanded'}
            transition={{ duration: 0.8 }}
          >
            <SidebarTrigger />
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className={"cursor-pointer"}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </motion.div>
        </SidebarHeader>
        <SidebarContent className="gap-4 px-2 py-4">
          <DashboardNavigation routes={appRoutes} />
        </SidebarContent>
        <SidebarFooter className="px-2">
          <TeamSwitcher teams={teams} />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
