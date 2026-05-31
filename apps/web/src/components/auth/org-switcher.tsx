"use client";

import {
	Command,
	CommandCollection,
	CommandEmpty,
	CommandFooter,
	CommandGroup,
	CommandGroupLabel,
	CommandInput,
	CommandItem,
	CommandList,
	CommandPanel,
	CommandSeparator,
} from "@matdesk/ui/components/command";
import { Kbd, KbdGroup } from "@matdesk/ui/components/kbd";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@matdesk/ui/components/popover";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@matdesk/ui/components/sidebar";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckIcon,
	ChevronsUpDownIcon,
	CornerDownLeftIcon,
	Loader2Icon,
	PlusIcon,
} from "lucide-react";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { NoOrganization } from "@/components/auth/no-organization";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";

type OrgItem = {
	value: string;
	label: string;
	logo: string | null;
	isActive: boolean;
};

type OrgGroup = {
	value: string;
	items: OrgItem[];
};

export function OrgSwitcher() {
	const {
		organizations,
		activeOrganization,
		isOrganizationsPending,
		setActiveOrganization,
	} = useAuth();
	const [open, setOpen] = React.useState(false);

	const activeOrg = activeOrganization ?? organizations[0] ?? null;

	const orgItems: OrgItem[] = organizations.map((org) => ({
		value: org.id,
		label: org.name,
		logo: org.logo ?? null,
		isActive: org.id === activeOrg?.id,
	}));

	const groupedItems: OrgGroup[] = [
		{ value: "Organizations", items: orgItems },
		{
			value: "Actions",
			items: [
				{ value: "create-new", label: "Create organization", logo: null, isActive: false },
			],
		},
	];

	function handleCreate() {
		// TODO: open create-organization flow.
		setOpen(false);
	}

	function handleItemClick(item: OrgItem) {
		if (item.value === "create-new") {
			handleCreate();
			return;
		}
		void setActiveOrganization(item.value);
		setOpen(false);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<SidebarMenu className="w-full">
				<SidebarMenuItem>
					<PopoverTrigger
						render={
							<SidebarMenuButton className="group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:px-0!" />
						}
					>
						<OrganizationAvatar
							className="size-5 shrink-0 rounded-md"
							id={activeOrg?.id ?? "none"}
							logo={activeOrg?.logo}
							name={activeOrg?.name ?? "Organization"}
						/>
						<span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
							{activeOrg?.name ?? "Select organization"}
						</span>
						<ChevronsUpDownIcon className="ml-auto text-muted-foreground/60 group-data-[collapsible=icon]:hidden" />
					</PopoverTrigger>
				</SidebarMenuItem>
			</SidebarMenu>
			<PopoverContent
				align="start"
				side="bottom"
				sideOffset={8}
				className="w-80 p-0 before:bg-muted/72 [&>[data-slot=popover-viewport]]:p-0"
			>
				<Command items={groupedItems}>
					<div className="relative">
						<CommandInput placeholder="Search organizations..." size="sm" />
						<div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
							<KbdGroup>
								<Kbd>⌘</Kbd>
								<Kbd>⇧</Kbd>
								<Kbd>O</Kbd>
							</KbdGroup>
						</div>
					</div>
					<CommandPanel>
						{isOrganizationsPending ? (
							<div className="flex items-center justify-center py-4">
								<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
							</div>
						) : organizations.length === 0 ? (
							<NoOrganization onCreate={handleCreate} />
						) : (
							<>
								<CommandEmpty>No organizations found.</CommandEmpty>
								<CommandList>
									{(group: OrgGroup, _index: number) => (
										<React.Fragment key={group.value}>
											<CommandGroup items={group.items}>
												<CommandGroupLabel>{group.value}</CommandGroupLabel>
												<CommandCollection>
													{(item: OrgItem) => (
														<CommandItem
															key={item.value}
															onClick={() => handleItemClick(item)}
															value={item.value}
															className="gap-2 py-1.5"
														>
															{item.value === "create-new" ? (
																<>
																	<div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
																		<PlusIcon className="size-3 text-primary" />
																	</div>
																	<span className="min-w-0 flex-1 truncate text-sm">
																		{item.label}
																	</span>
																</>
															) : (
																<>
																	<OrganizationAvatar
																		className="size-6 shrink-0 rounded"
																		id={item.value}
																		logo={item.logo}
																		name={item.label}
																	/>
																	<span className="min-w-0 flex-1 truncate text-sm">
																		{item.label}
																	</span>
																	{item.isActive ? (
																		<CheckIcon className="size-3.5 shrink-0 text-primary" />
																	) : null}
																</>
															)}
														</CommandItem>
													)}
												</CommandCollection>
											</CommandGroup>
											<CommandSeparator />
										</React.Fragment>
									)}
								</CommandList>
							</>
						)}
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
								<span>Select</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Kbd>Esc</Kbd>
							<span>Close</span>
						</div>
					</CommandFooter>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
