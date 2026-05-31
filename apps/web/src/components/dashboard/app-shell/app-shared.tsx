import {
	BarChart3Icon,
	BoxesIcon,
	CameraIcon,
	CreditCardIcon,
	LayoutGridIcon,
	MapIcon,
	PackageIcon,
	SettingsIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import type { FileRouteTypes } from "@/routeTree.gen";

type RoutePath = FileRouteTypes["to"];

export type NavSubItem = {
	title: string;
	path: RoutePath;
	icon?: ReactNode;
};

export type NavItem = {
	title: string;
	path: RoutePath;
	icon?: ReactNode;
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
			{
				title: "Inventar",
				path: "/dashboard/inventory",
				icon: <PackageIcon />,
			},
		],
	},
	{
		label: "Administration",
		items: [
			{
				title: "Einstellungen",
				path: "/dashboard/settings",
				icon: <SettingsIcon />,
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
