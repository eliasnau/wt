import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup, SidebarNavItem } from "./app-shared";

const badgeClassName =
	"h-5 min-w-fit rounded-sm border border-sidebar-border/80 bg-sidebar-accent/40 px-1.5 font-semibold text-[10px] uppercase tracking-wide";

function AnimatedIcon({
	icon,
	animate = false,
}: {
	icon?: React.ReactNode;
	animate?: boolean;
}) {
	if (!icon) {
		return null;
	}

	return (
		<AnimateIcon
			animate={animate}
			className="inline-flex items-center justify-center"
		>
			{icon}
		</AnimateIcon>
	);
}

function NavGroupItem({ item }: { item: SidebarNavItem }) {
	const hasSubItems = (item.subItems?.length ?? 0) > 0;
	const shouldBeOpen = useMemo(
		() =>
			!!item.isActive ||
			item.subItems?.some((subItem) => !!subItem.isActive) === true,
		[item.isActive, item.subItems],
	);
	const [open, setOpen] = useState(shouldBeOpen);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		if (shouldBeOpen) {
			setOpen(true);
		}
	}, [shouldBeOpen]);

	if (!hasSubItems) {
		return (
			<SidebarMenuItem className="w-full">
				<SidebarMenuButton
					asChild
					className="w-full"
					isActive={item.isActive}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<Link href={item.path ?? "/dashboard"}>
						<AnimatedIcon animate={isHovered} icon={item.icon} />
						<span>{item.title}</span>
					</Link>
				</SidebarMenuButton>
				{item.badge ? (
					<SidebarMenuBadge className={badgeClassName}>
						{item.badge}
					</SidebarMenuBadge>
				) : null}
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem className="w-full">
			<Collapsible
				className="group/collapsible block w-full"
				onOpenChange={setOpen}
				open={open}
			>
				<CollapsibleTrigger
					className="w-full"
					render={
						<SidebarMenuButton
							className="w-full"
							isActive={item.isActive}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
						/>
					}
				>
					<AnimatedIcon animate={isHovered} icon={item.icon} />
					<span>{item.title}</span>
					<ChevronRightIcon
						className={`ml-auto transition-transform duration-200 ${
							open ? "rotate-90" : ""
						}`}
					/>
				</CollapsibleTrigger>
				{item.badge ? (
					<SidebarMenuBadge className={badgeClassName}>
						{item.badge}
					</SidebarMenuBadge>
				) : null}
				<CollapsibleContent>
					<SidebarMenuSub>
						{item.subItems?.map((subItem) => (
							<SidebarSubItem key={subItem.title} subItem={subItem} />
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}

function SidebarSubItem({ subItem }: { subItem: SidebarNavItem }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<SidebarMenuSubItem>
			<SidebarMenuSubButton
				asChild
				isActive={subItem.isActive}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<Link href={subItem.path ?? "/dashboard"}>
					<AnimatedIcon animate={isHovered} icon={subItem.icon} />
					<span>{subItem.title}</span>
				</Link>
			</SidebarMenuSubButton>
		</SidebarMenuSubItem>
	);
}

export function NavGroup({ label, items }: SidebarNavGroup) {
	return (
		<SidebarGroup>
			{label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
			<SidebarMenu>
				{items.map((item) => (
					<NavGroupItem item={item} key={item.title} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
