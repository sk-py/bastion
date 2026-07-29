'use client';

import { motion } from 'motion/react';
import {
  Activity,
  DollarSign,
  Home,
  Infinity,
  LinkIcon,
  Package2,
  Percent,
  PieChart,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
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
import type { Route } from './sidebar-routes';
import { TeamSwitcher } from './team-switcher';
import DashboardNavigation from './sidebar-menu';
// import DashboardNavigation from './nav-main';
// import { NotificationsPopover } from './nav-notifications';
// import { TeamSwitcher } from './team-switcher';



const dashboardRoutes: Route[] = [
  {
    id: 'home',
    title: 'Home',
    icon: <Home className="size-4" />,
    link: '#',
  },
  {
    id: 'products',
    title: 'Products',
    icon: <Package2 className="size-4" />,
    link: '#',
    subs: [
      {
        title: 'Catalogue',
        link: '#',
        icon: <Package2 className="size-4" />,
      },
      {
        title: 'Checkout Links',
        link: '#',
        icon: <LinkIcon className="size-4" />,
      },
      {
        title: 'Discounts',
        link: '#',
        icon: <Percent className="size-4" />,
      },
    ],
  },
  {
    id: 'usage-billing',
    title: 'Usage Billing',
    icon: <PieChart className="size-4" />,
    link: '#',
    subs: [
      {
        title: 'Meters',
        link: '#',
        icon: <PieChart className="size-4" />,
      },
      {
        title: 'Events',
        link: '#',
        icon: <Activity className="size-4" />,
      },
    ],
  },
  {
    id: 'benefits',
    title: 'Benefits',
    icon: <Sparkles className="size-4" />,
    link: '#',
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: <Users className="size-4" />,
    link: '#',
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: <ShoppingBag className="size-4" />,
    link: '#',
    subs: [
      {
        title: 'Orders',
        link: '#',
        icon: <ShoppingBag className="size-4" />,
      },
      {
        title: 'Subscriptions',
        link: '#',
        icon: <Infinity className="size-4" />,
      },
    ],
  },
  {
    id: 'storefront',
    title: 'Storefront',
    icon: <Store className="size-4" />,
    link: '#',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: <TrendingUp className="size-4" />,
    link: '#',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: <DollarSign className="size-4" />,
    link: '#',
    subs: [
      { title: 'Incoming', link: '#' },
      { title: 'Outgoing', link: '#' },
      { title: 'Payout Account', link: '#' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings className="size-4" />,
    link: '#',
    subs: [
      { title: 'General', link: '#' },
      { title: 'Webhooks', link: '#' },
      { title: 'Custom Fields', link: '#' },
    ],
  },
];

const teams = [
  { id: '1', name: 'Alpha Inc.', logo: "./android-chrome-512x512.png", plan: 'Free' },
  { id: '2', name: 'Beta Corp.', logo: "./android-chrome-512x512.png", plan: 'Free' },
  { id: '3', name: 'Gamma Tech', logo: "./android-chrome-512x512.png", plan: 'Free' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';



  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader
        className={cn(
          'flex md:pt-3.5',
          isCollapsed
            ? 'flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start'
            : 'flex-row items-center justify-between'
        )}
      >
        <a className="flex items-center gap-2" href="#">
          <img src='../../../public/android-chrome-512x512.png' className='object-contain size-12' />
        </a>

        {/* <motion.div
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-2',
            isCollapsed ? 'flex-row md:flex-col-reverse' : 'flex-row'
          )}
          initial={{ opacity: 0 }}
          key={isCollapsed ? 'header-collapsed' : 'header-expanded'}
          transition={{ duration: 0.8 }}
          >
          <p>BASTION</p>
          <SidebarTrigger />
        </motion.div> */}
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <TeamSwitcher teams={teams} />
      </SidebarFooter>
    </Sidebar>
  );
}
