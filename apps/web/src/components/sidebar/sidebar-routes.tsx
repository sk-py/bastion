import { Home, Server, Settings, Shield, Users } from "lucide-react";
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
    title: "Dashboard",
    icon: <Home className="size-4" />,
    link: "/dashboard",
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
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: <Shield className="size-4" />,
    link: "#",
    subs: [
      {
        title: "Users",
        icon: <Users className="size-4" />,
        link: "/users",
      },
      {
        title: "Roles",
        icon: <Shield className="size-4" />,
        link: "/roles",
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