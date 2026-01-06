"use client";

import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { openOrganizationSwitcher } from "@/components/organization-switcher";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandCollection,
	CommandDialog,
	CommandDialogPopup,
	CommandDialogTrigger,
	CommandEmpty,
	CommandFooter,
	CommandGroup,
	CommandGroupLabel,
	CommandInput,
	CommandItem,
	CommandList,
	CommandPanel,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Route } from "next";
import posthog from "posthog-js";

export interface Item {
	value: string;
	label: string;
	shortcut?: string;
	href?: string;
	action?: () => void;
}

export interface Group {
	value: string;
	items: Item[];
}

export const pages: Item[] = [
	{
		value: "home",
		label: "Home",
		href: "/dashboard",
	},
	{
		value: "members",
		label: "Members",
		shortcut: "⇧M",
		href: "/dashboard/members",
	},
	{
		value: "groups",
		label: "Groups",
		shortcut: "⇧G",
		href: "/dashboard/groups",
	},
	{
		value: "statistics",
		label: "Statistics",
		href: "/dashboard/statistics/overview",
	},
	{
		value: "events",
		label: "Events",
		href: "/dashboard/events",
	},
];

export const settings: Item[] = [
	{
		value: "settings-general",
		label: "General",
		href: "/dashboard/settings/general",
	},
	{
		value: "settings-members",
		label: "Users",
		href: "/dashboard/settings/members",
	},
	{
		value: "settings-sepa",
		label: "SEPA",
		href: "/dashboard/settings/sepa",
	},
];

export function CommandSearch() {
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const router = useRouter();

	// Track command bar session state
	const sessionRef = React.useRef<{
		didSearch: boolean;
		didSelectItem: boolean;
	}>({
		didSearch: false,
		didSelectItem: false,
	});

	const commands: Item[] = [
		{
			value: "switch-org",
			label: "Switch Organization",
			shortcut: "⌘⇧O",
			action: () => openOrganizationSwitcher(),
		},
	];

	const groupedItems: Group[] = [
		{ items: pages, value: "Pages" },
		{ items: commands, value: "Commands" },
		{ items: settings, value: "Settings" },
	];

	function handleItemClick(item: Item) {
		// Mark that user selected an item
		sessionRef.current.didSelectItem = true;

		// Track which item was selected
		posthog.capture("command_bar:item_select", {
			item_value: item.value,
			item_label: item.label,
		});

		setOpen(false);

		// Handle href navigation
		if (item.href) {
			router.push(item.href as Route);
			return;
		}

		// Handle action execution
		if (item.action) {
			item.action();
			return;
		}
	}

	// Track search queries
	React.useEffect(() => {
		if (!open || !searchQuery) return;

		// Mark that user searched during this session
		sessionRef.current.didSearch = true;
	}, [searchQuery, open]);

	// Track command bar open/close and session completion
	// Track command bar open/close and session completion
	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				const newOpenState = !open;
				setOpen(newOpenState);

				if (newOpenState) {
					posthog.capture("command_bar:open");
				}
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open]);

	// Handle command bar close and track session completion
	const handleOpenChange = React.useCallback(
		(isOpen: boolean) => {
			if (!isOpen && open) {
				// Use setTimeout to ensure state updates have completed
				setTimeout(() => {
					// Command bar is closing - track the session outcome
					posthog.capture("command_bar:close", {
						did_search: sessionRef.current.didSearch,
						did_select_item: sessionRef.current.didSelectItem,
						abandoned:
							sessionRef.current.didSearch && !sessionRef.current.didSelectItem,
					});

					// Reset session state
					sessionRef.current = {
						didSearch: false,
						didSelectItem: false,
					};
					setSearchQuery("");
				}, 0);
			} else if (isOpen && !open) {
				// Command bar is opening - track open event
				posthog.capture("command_bar:open");
			}

			setOpen(isOpen);
		},
		[open],
	);

	return (
		<>
			<CommandDialog onOpenChange={handleOpenChange} open={open}>
				<CommandDialogTrigger render={<Button variant="outline" />}>
					Open Command Palette
					<Kbd>⌘K</Kbd>
				</CommandDialogTrigger>
				<CommandDialogPopup>
					<Command items={groupedItems}>
						<CommandInput
							placeholder="Search for pages and commands..."
							onValueChange={setSearchQuery}
						/>
						<CommandPanel>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandList>
								{(group: Group, _index: number) => (
									<React.Fragment key={group.value}>
										<CommandGroup items={group.items}>
											<CommandGroupLabel>{group.value}</CommandGroupLabel>
											<CommandCollection>
												{(item: Item) => (
													<CommandItem
														key={item.value}
														onClick={() => handleItemClick(item)}
														value={item.value}
													>
														<span className="flex-1">{item.label}</span>
														{item.shortcut && (
															<CommandShortcut>{item.shortcut}</CommandShortcut>
														)}
													</CommandItem>
												)}
											</CommandCollection>
										</CommandGroup>
										<CommandSeparator />
									</React.Fragment>
								)}
							</CommandList>
						</CommandPanel>
						<CommandFooter>
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<KbdGroup>
										<Kbd>
											<ArrowUpIcon />
										</Kbd>
										<Kbd>
											<ArrowDownIcon />
										</Kbd>
									</KbdGroup>
									<span>Navigate</span>
								</div>
								<div className="flex items-center gap-2">
									<Kbd>
										<CornerDownLeftIcon />
									</Kbd>
									<span>Open</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<KbdGroup>
									<Kbd>⌘</Kbd>
									<Kbd>K</Kbd>
								</KbdGroup>
								<span>Close</span>
							</div>
						</CommandFooter>
					</Command>
				</CommandDialogPopup>
			</CommandDialog>
		</>
	);
}
