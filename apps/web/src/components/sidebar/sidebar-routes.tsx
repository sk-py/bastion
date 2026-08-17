import {
  Home,
  Server,
  Settings,
  Shield,
  Timeline,
  Users,
} from "lucide-react";
import type React from "react";

export type UserRole = "owner" | "admin" | "member";

export type Subs = {
  title: string;
  icon?: React.ReactNode;
  link: string;
  roles: UserRole[];
};

export type Route = {
  id: string;
  title: string;
  icon: React.ReactNode;
  link: string;
  roles: UserRole[];
  subs?: Subs[];
};

export const appRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Home",
    icon: <Home className="size-4" />,
    link: "/",
    roles: ["owner", "admin", "member"],
  },

  {
    id: "infrastructure",
    title: "Infrastructure",
    icon: <Server className="size-4" />,
    link: "#",
    roles: ["owner", "admin", "member"],
    subs: [
      {
        title: "Servers",
        icon: <Server className="size-4" />,
        link: "/servers",
        roles: ["owner", "admin", "member"],
      },
      {
        title: "Sessions",
        icon: <Timeline className="size-4" />,
        link: "/sessions",
        roles: ["owner", "admin", "member"],
      },
    ],
  },

  {
    id: "administration",
    title: "Administration",
    icon: <Shield className="size-4" />,
    link: "#",
    roles: ["owner", "admin"],
    subs: [
      {
        title: "Members",
        icon: <Users className="size-4" />,
        link: "/members",
        roles: ["owner", "admin"],
      },
      {
        title: "Groups",
        icon: <Shield className="size-4" />,
        link: "/groups",
        roles: ["owner", "admin"],
      },
    ],
  },

  {
    id: "settings",
    title: "Settings",
    icon: <Settings className="size-4" />,
    link: "/settings",
    roles: ["owner", "admin"],
  },
];