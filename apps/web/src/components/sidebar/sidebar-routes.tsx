import { Home, Server, Settings, Shield, Timeline, Users } from "lucide-react";
import type React from "react";

export type subs = {
  title: string;
  icon?: React.ReactNode;
  link: string;
}

export type Route = {
  id: string;
  title: string;
  icon: React.ReactNode;
  link: string,
  subs?: subs[]
}

export const appRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Home",
    icon: <Home className="size-4" />,
    link: "/",
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    icon: <Server className="size-4" />,
    link: "#",
    subs: [
      {
        title: "Servers",
        icon: <Server className="size-4" />,
        link: "/servers",
      },
      {
        title: "Sessions",
        icon: <Timeline className="size-4" />,
        link: "/sessions",
      },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: <Shield className="size-4" />,
    link: "#",
    subs: [
      {
        title: "Members",
        icon: <Users className="size-4" />,
        link: "/members",
      },
      {
        title: "Groups",
        icon: <Shield className="size-4" />,
        link: "/groups",
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: <Settings className="size-4" />,
    link: "/settings",
  },
];