"use client";

import { env } from "@repo/env/web";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
	BookOpenIcon,
	DollarSignIcon,
	HelpCircleIcon,
	ShieldIcon,
	ArrowLeftIcon,
} from "lucide-react";
import { ChartLine } from "@/components/animate-ui/icons/chart-line";
import { ClipboardCheck } from "@/components/animate-ui/icons/clipboard-check";
import { Layers } from "@/components/animate-ui/icons/layers";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { SlidersHorizontal } from "@/components/animate-ui/icons/sliders-horizontal";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { User } from "@/components/animate-ui/icons/user";
import { Users } from "@/components/animate-ui/icons/users";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	badge?: string;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

const isActivePath = (pathname: string | null, path?: string, exact?: boolean) => {
	if (!pathname || !path) {
		return false;
	}

	return exact ? pathname === path : pathname.startsWith(path);
};

export function useAppShellNavigation() {
	const pathname = usePathname();
	const docsUrl = env.NEXT_PUBLIC_MATDESK_DOCS_URL?.trim();
	const isAccountRoute = pathname?.startsWith("/account") ?? false;

	return useMemo(() => {
		const navGroups: SidebarNavGroup[] = isAccountRoute
			? [
					{
						items: [
							{
								title: "Zurück zum Dashboard",
								path: "/dashboard",
								icon: <ArrowLeftIcon />,
							},
						],
					},
					{
						label: "Konto",
						items: [
							{
								title: "Allgemein",
								path: "/account",
								icon: <User className="size-4" />,
								isActive: isActivePath(pathname, "/account", true),
							},
							{
								title: "Anpassung",
								path: "/account/customization",
								icon: <SlidersHorizontal className="size-4" />,
								isActive: isActivePath(pathname, "/account/customization"),
							},
							{
								title: "Sicherheit",
								path: "/account/security",
								icon: <ShieldIcon />,
								isActive: isActivePath(pathname, "/account/security"),
							},
						],
					},
				]
			: [
					{
						label: "Produkt",
						items: [
							{
								title: "Dashboard",
								path: "/dashboard",
								icon: <LayoutDashboard className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard", true),
							},
							{
								title: "Mitglieder",
								path: "/dashboard/members",
								icon: <Users className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/members"),
							},
							{
								title: "Gruppen",
								path: "/dashboard/groups",
								icon: <Layers className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/groups"),
							},
							{
								title: "KI-Assistent",
								path: "/dashboard/ai",
								icon: <Sparkles className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/ai"),
								badge: "Beta",
							},
							{
								title: "Statistiken",
								path: "/dashboard/statistics",
								icon: <ChartLine className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/statistics"),
								subItems: [
									{
										title: "Übersicht",
										path: "/dashboard/statistics/overview",
										isActive: isActivePath(
											pathname,
											"/dashboard/statistics/overview",
										),
									},
									{
										title: "Monate vergleichen",
										path: "/dashboard/statistics/range",
										isActive: isActivePath(
											pathname,
											"/dashboard/statistics/range",
										),
									},
									{
										title: "Karte",
										path: "/dashboard/statistics/map",
										isActive: isActivePath(
											pathname,
											"/dashboard/statistics/map",
										),
									},
								],
							},
						],
					},
					{
						label: "Arbeitsbereich",
						items: [
							{
								title: "Finanzen",
								path: "/dashboard/finance",
								icon: <DollarSignIcon className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/finance"),
								subItems: [
									{
										title: "Rechnungen",
										path: "/dashboard/finance/invoices",
										isActive: isActivePath(
											pathname,
											"/dashboard/finance/invoices",
										),
									},
									{
										title: "SEPA-Läufe",
										path: "/dashboard/finance/sepa-batches",
										isActive: isActivePath(
											pathname,
											"/dashboard/finance/sepa-batches",
										),
									},
									{
										title: "Gutschriften",
										path: "/dashboard/finance/credits",
										isActive: isActivePath(
											pathname,
											"/dashboard/finance/credits",
										),
									},
								],
							},
							{
								title: "Selbstservice",
								path: "/dashboard/self-service",
								icon: <ClipboardCheck className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/self-service"),
								subItems: [
									{
										title: "Anmeldungen",
										path: "/dashboard/self-service/registrations",
										isActive: isActivePath(
											pathname,
											"/dashboard/self-service/registrations",
										),
									},
								],
							},
						],
					},
					{
						label: "Verwaltung",
						items: [
							{
								title: "Einstellungen",
								path: "/dashboard/settings",
								icon: <SlidersHorizontal className="size-4" />,
								isActive: isActivePath(pathname, "/dashboard/settings"),
								subItems: [
									{
										title: "Allgemein",
										path: "/dashboard/settings/general",
										isActive: isActivePath(
											pathname,
											"/dashboard/settings/general",
										),
									},
									{
										title: "Abrechnung",
										path: "/dashboard/settings/billing",
										isActive: isActivePath(
											pathname,
											"/dashboard/settings/billing",
										),
									},
									{
										title: "Benutzer",
										path: "/dashboard/settings/users",
										isActive: isActivePath(
											pathname,
											"/dashboard/settings/users",
										),
									},
									{
										title: "SEPA",
										path: "/dashboard/settings/sepa",
										isActive: isActivePath(pathname, "/dashboard/settings/sepa"),
									},
								],
							},
						],
					},
				];

		const footerNavLinks: SidebarNavItem[] = [
			{
				title: "Hilfezentrum",
				path: docsUrl || "/account",
				icon: <HelpCircleIcon />,
			},
			{
				title: "Dokumentation",
				path: docsUrl || "/dashboard/ai",
				icon: <BookOpenIcon />,
			},
		];

		const navLinks = [
			...navGroups.flatMap((group) =>
				group.items.flatMap((item) =>
					item.subItems?.length ? [item, ...item.subItems] : [item],
				),
			),
			...footerNavLinks,
		];

		return {
			footerNavLinks,
			navGroups,
			navLinks,
		};
	}, [docsUrl, isAccountRoute, pathname]);
}
