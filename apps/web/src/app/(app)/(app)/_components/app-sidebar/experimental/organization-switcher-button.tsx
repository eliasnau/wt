"use client";

import { ORPCError } from "@orpc/client";
import { authClient } from "@repo/auth/client";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	Check,
	ChevronsUpDown,
	CornerDownLeftIcon,
	Loader2,
	Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";

import { toast } from "sonner";
import { OrganizationAvatar } from "@/components/organization-avatar";
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
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
};

export function OrganizationSwitcherButton() {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const { session, switchOrganization } = useAuth();
	const { data: organizationsData, isPending: isOrganizationsPending } =
		authClient.useListOrganizations();
	const { isPending: isSessionPending } = authClient.useSession();
	const organizations = organizationsData as Organization[] | undefined;
	const activeOrgId = session?.session?.activeOrganizationId;
	const activeOrg = organizations?.find((org) => org.id === activeOrgId);

	const setActiveOrgMutation = useMutation({
		mutationFn: (organizationId: string) =>
			switchOrganization(organizationId, "sidebar_switcher"),
		onSuccess: () => {
			setOpen(false);
		},
		onError: (error) => {
			toast.error(
				error instanceof ORPCError
					? error.message
					: "Failed to switch organization",
			);
		},
	});

	const handleSwitchOrg = (organizationId: string) => {
		if (session?.session?.activeOrganizationId === organizationId) {
			setOpen(false);
			return;
		}
		setActiveOrgMutation.mutate(organizationId);
	};

	const handleCreateNew = () => {
		setOpen(false);
		router.push("/account/organizations");
	};

	const orgItems =
		organizations?.map((org) => ({
			value: org.id,
			label: org.name,
			slug: org.slug,
			logo: org.logo,
			isActive: session?.session?.activeOrganizationId === org.id,
		})) ?? [];

	const createNewItem = { value: "create-new", label: "Create New Organization" };

	const groupedItems = [
		{ value: "Organizations", items: orgItems },
		{ value: "Actions", items: [createNewItem] },
	];

	function handleItemClick(item: { value: string }) {
		if (item.value === "create-new") {
			handleCreateNew();
		} else {
			handleSwitchOrg(item.value);
		}
	}

	if (isSessionPending || isOrganizationsPending) {
		return (
			<div className="flex h-8 w-full items-center gap-2 rounded-md px-2">
				<Skeleton className="size-5 rounded-md" />
				<Skeleton className="h-3 w-24 rounded" />
			</div>
		);
	}

	if (!activeOrg) {
		return null;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<SidebarMenu className="w-full">
				<SidebarMenuItem>
					<PopoverTrigger render={<SidebarMenuButton />}>
						<OrganizationAvatar
							className="size-5 rounded-md"
							id={activeOrg.id}
							logo={activeOrg.logo}
							name={activeOrg.name}
						/>
						<span className="min-w-0 flex-1 truncate">{activeOrg.name}</span>
						<ChevronsUpDown className="ml-auto text-muted-foreground/60" />
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
								<Loader2 className="size-4 animate-spin text-muted-foreground" />
							</div>
						) : (
							<>
								<CommandEmpty>No organizations found.</CommandEmpty>
								<CommandList>
									{(
										group: {
											value: string;
											items: typeof orgItems;
										},
										_index: number,
									) => (
										<React.Fragment key={group.value}>
											<CommandGroup items={group.items}>
												<CommandGroupLabel>{group.value}</CommandGroupLabel>
												<CommandCollection>
													{(item: (typeof orgItems)[0]) => {
														const isSwitching =
															setActiveOrgMutation.isPending &&
															setActiveOrgMutation.variables === item.value;

														return (
															<CommandItem
																key={item.value}
																onClick={() => handleItemClick(item)}
																value={item.value}
																disabled={setActiveOrgMutation.isPending}
																className="gap-2 py-1.5"
															>
																{item.value === "create-new" ? (
																	<>
																		<div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
																			<Plus className="size-3 text-primary" />
																		</div>
																		<span className="min-w-0 flex-1 truncate text-sm">
																			{item.label}
																		</span>
																	</>
																) : (
																	<>
																		<OrganizationAvatar
																			id={item.value}
																			name={item.label}
																			logo={item.logo}
																			className="size-6 shrink-0 rounded"
																		/>
																		<span className="min-w-0 flex-1 truncate text-sm">
																			{item.label}
																		</span>
																		{isSwitching ? (
																			<Loader2 className="size-3.5 shrink-0 animate-spin" />
																		) : item.isActive ? (
																			<Check className="size-3.5 shrink-0 text-primary" />
																		) : null}
																	</>
																)}
															</CommandItem>
														);
													}}
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
