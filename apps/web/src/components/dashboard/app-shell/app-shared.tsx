import {
  BarChart3Icon,
  CalendarDaysIcon,
  BoxesIcon,
  CameraIcon,
  CreditCardIcon,
  LandmarkIcon,
  LayoutGridIcon,
  MapIcon,
  PackageIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  UsersIcon,
  AwardIcon,
  DumbbellIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import type { FileRouteTypes } from "@/routeTree.gen";

type RoutePath = FileRouteTypes["to"];

export type NavSubItem = {
  title: string;
  path: RoutePath;
  icon?: ReactNode;
  badge?: string;
  /** Match the route exactly (used when a sub-path equals its parent). */
  exact?: boolean;
};

export type NavItem = {
  title: string;
  path: RoutePath;
  icon?: ReactNode;
  badge?: string;
  /** Match the route exactly (used for the index/overview link). */
  exact?: boolean;
  subItems?: NavSubItem[];
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Übersicht",
        path: "/dashboard",
        exact: true,
        icon: <LayoutGridIcon />,
      },
    ],
  },
  {
    label: "Organisation",
    items: [
      {
        title: "Mitglieder",
        path: "/dashboard/members",
        icon: <UsersIcon />,
      },
      {
        title: "Gruppen",
        path: "/dashboard/groups",
        icon: <BoxesIcon />,
      },
      {
        title: "Graduierungen",
        path: "/dashboard/progression",
        icon: <AwardIcon />,
        badge: "Neu",
      },
      {
        title: "Einzelcoaching",
        path: "/dashboard/coaching",
        icon: <DumbbellIcon />,
        badge: "Neu",
      },
      {
        title: "Statistiken",
        path: "/dashboard/statistics",
        icon: <BarChart3Icon />,
        subItems: [
          {
            title: "Zeitverlauf",
            path: "/dashboard/statistics/timeline",
            icon: <TrendingUpIcon />,
          },
          {
            title: "Momentaufnahme",
            path: "/dashboard/statistics/snapshot",
            icon: <CameraIcon />,
          },
          {
            title: "Mitgliederkarte",
            path: "/dashboard/statistics/members",
            icon: <MapIcon />,
          },
        ],
      },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      {
        title: "Inventar",
        path: "/dashboard/inventory",
        icon: <PackageIcon />,
      },
      {
        title: "Veranstaltungen",
        path: "/dashboard/events",
        icon: <CalendarDaysIcon />,
        badge: "Neu",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Team",
        path: "/dashboard/settings/team",
        icon: <UsersIcon />,
      },
      {
        title: "Einstellungen",
        path: "/dashboard/settings",
        icon: <SettingsIcon />,
        subItems: [
          {
            title: "Allgemein",
            path: "/dashboard/settings",
            icon: <SlidersHorizontalIcon />,
            exact: true,
          },
          {
            title: "SEPA",
            path: "/dashboard/settings/sepa",
            icon: <LandmarkIcon />,
          },
        ],
      },
      {
        title: "Billing",
        path: "/dashboard/billing",
        icon: <CreditCardIcon />,
      },
    ],
  },
];

/** Flattened list (parents + sub-items) for breadcrumb / active lookups. */
export const navLinks: Array<NavItem | NavSubItem> = navGroups
  .flatMap((group) => group.items)
  .flatMap((item) => (item.subItems?.length ? [item, ...item.subItems] : [item]));
