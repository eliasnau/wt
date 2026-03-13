"use client";

import { DollarSign, PieChart } from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { Blocks } from "@/components/animate-ui/icons/blocks";
import { ChartLine } from "@/components/animate-ui/icons/chart-line";
import { ClipboardCheck } from "@/components/animate-ui/icons/clipboard-check";
import { Layers } from "@/components/animate-ui/icons/layers";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { SlidersHorizontal } from "@/components/animate-ui/icons/sliders-horizontal";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Users } from "@/components/animate-ui/icons/users";
import { SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollapsibleNavGroup } from "./collapsible-nav-group";
import { NavButton } from "./nav-button";

type RouteConfig = {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  subs?: {
    title: string;
    href: string;
    icon?: React.ReactNode;
  }[];
};

const routes: RouteConfig[] = [
  {
    id: "home",
    title: "Startseite",
    icon: <LayoutDashboard className="size-4" />,
    href: "/dashboard",
  },
  {
    id: "members",
    title: "Mitglieder",
    icon: <Users className="size-4" size={16} />,
    href: "/dashboard/members",
  },
  {
    id: "groups",
    title: "Gruppen",
    icon: <Layers className="size-4" animation="default-loop" />,
    href: "/dashboard/groups",
  },
  {
    id: "ai",
    title: "KI-Assistent",
    icon: <Sparkles className="size-4" />,
    href: "/dashboard/ai",
  },
  {
    id: "statistics",
    title: "Statistiken",
    icon: <ChartLine className="size-4" />,
    href: "/dashboard/statistics",
    subs: [
      {
        title: "Übersicht",
        href: "/dashboard/statistics/overview",
        icon: <PieChart className="size-4" />,
      },
      {
        title: "Monate vergleichen",
        href: "/dashboard/statistics/range",
        icon: <PieChart className="size-4" />,
      },
    ],
  },
  {
    id: "finance",
    title: "Finanzen",
    icon: <DollarSign className="size-4" />,
    href: "/dashboard/finance",
  },
  {
    id: "self-service",
    title: "Self-Service",
    icon: <ClipboardCheck className="size-4" />,
    href: "/dashboard/self-service",
    subs: [
      {
        title: "Registrierungen",
        href: "/dashboard/self-service/registrations",
      },
    ],
  },
  {
    id: "settings",
    title: "Einstellungen",
    icon: <SlidersHorizontal className="size-4" />,
    href: "/dashboard/settings",
    subs: [
      { title: "Allgemein", href: "/dashboard/settings/general" },
      { title: "Abrechnung", href: "/dashboard/settings/billing" },
      { title: "Benutzer", href: "/dashboard/settings/members" },
      { title: "SEPA", href: "/dashboard/settings/sepa" },
    ],
  },
];

export function DashboardLayout() {
  const pathname = usePathname();

  // Find which groups should be auto-opened based on current path
  const activeGroupId = useMemo(() => {
    const match = routes.find(
      (r) =>
        r.subs?.some((sub) => pathname?.startsWith(sub.href)) ||
        (r.subs && pathname?.startsWith(r.href)),
    );
    return match?.id ?? null;
  }, [pathname]);

  // Use a Set so multiple groups can be open simultaneously
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(
    activeGroupId ? new Set([activeGroupId]) : new Set(),
  );
  const [prevActiveGroupId, setPrevActiveGroupId] = useState(activeGroupId);

  // Auto-open group when navigating to a child route
  if (activeGroupId !== prevActiveGroupId) {
    setPrevActiveGroupId(activeGroupId);
    if (activeGroupId) {
      setOpenGroupIds((prev) => new Set([...prev, activeGroupId]));
    }
  }

  const toggleGroup = (id: string) => {
    setOpenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <SidebarContent>
      <TooltipProvider delay={300}>
        <SidebarGroup className="mt-6 gap-1 px-2">
          {routes.map((route) => {
            const hasSubs = !!route.subs?.length;
            const isOpen = openGroupIds.has(route.id);

            if (hasSubs) {
              return (
                <CollapsibleNavGroup
                  key={route.id}
                  href={route.href}
                  icon={route.icon}
                  title={route.title}
                  isOpen={isOpen}
                  onToggle={() => toggleGroup(route.id)}
                  subTabs={route.subs!}
                  layoutId="dashboard-nav"
                />
              );
            }

            return (
              <NavButton
                key={route.id}
                href={route.href}
                icon={route.icon}
                title={route.title}
                exact={route.href === "/dashboard"}
                layoutId="dashboard-nav"
              />
            );
          })}
        </SidebarGroup>
      </TooltipProvider>
    </SidebarContent>
  );
}
