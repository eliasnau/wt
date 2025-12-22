"use client";

import { authClient } from "@repo/auth/client";
import { useMutation } from "@tanstack/react-query";
import { Building2, Check, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
};

interface OrganizationSwitcherProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

export function OrganizationSwitcher({
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	trigger,
}: OrganizationSwitcherProps) {
	const router = useRouter();
	const [internalOpen, setInternalOpen] = useState(false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = isControlled
		? controlledOnOpenChange || (() => {})
		: setInternalOpen;

	const {
		data: organizationsData,
		isPending,
		refetch,
	} = authClient.useListOrganizations();
	const organizations = organizationsData as Organization[] | undefined;
	const { data: session } = authClient.useSession();

	const setActiveOrgMutation = useMutation({
		mutationFn: async (organizationId: string) => {
			const { error } = await authClient.organization.setActive({
				organizationId,
			});
			if (error) {
				throw new Error(error.message || "Failed to switch organization");
			}
		},
		onSuccess: () => {
			toast.success("Organization switched successfully");
			setOpen(false);
			refetch();
			// Refresh the page to load the new organization context
			router.refresh();
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to switch organization",
			);
		},
	});

	const handleSwitchOrg = (organizationId: string) => {
		if (session?.session?.activeOrganizationId === organizationId) {
			// Already active, just close the dialog
			setOpen(false);
			return;
		}
		setActiveOrgMutation.mutate(organizationId);
	};

	const handleCreateNew = () => {
		setOpen(false);
		router.push("/account/organizations");
	};

	const DialogContent = (
		<DialogPopup>
			<DialogHeader>
				<DialogTitle>Switch Organization</DialogTitle>
			</DialogHeader>
			<DialogPanel className="">
				{isPending ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : organizations && organizations.length > 0 ? (
					<div className="max-h-[400px] space-y-1 overflow-y-auto">
						{organizations.map((org) => {
							const isActive =
								session?.session?.activeOrganizationId === org.id;
							const isSwitching =
								setActiveOrgMutation.isPending &&
								setActiveOrgMutation.variables === org.id;

							return (
								<button
									type="button"
									key={org.id}
									onClick={() => handleSwitchOrg(org.id)}
									disabled={setActiveOrgMutation.isPending}
									className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
								>
									{org.logo ? (
										<Image
											src={org.logo}
											alt={org.name}
											width={40}
											height={40}
											className="size-10 flex-shrink-0 rounded-md object-cover"
										/>
									) : (
										<div className="flex size-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
											<Building2 className="size-5 text-primary" />
										</div>
									)}
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{org.name}</p>
										<p className="truncate text-muted-foreground text-sm">
											{org.slug}
										</p>
									</div>
									{isSwitching ? (
										<Loader2 className="size-4 flex-shrink-0 animate-spin" />
									) : isActive ? (
										<Check className="size-4 flex-shrink-0 text-primary" />
									) : null}
								</button>
							);
						})}
					</div>
				) : (
					<div className="space-y-4 py-8 text-center">
						<p className="text-muted-foreground text-sm">
							You don't have any organizations yet.
						</p>
						<Button onClick={handleCreateNew}>
							<Plus className="mr-2 size-4" />
							Create Organization
						</Button>
					</div>
				)}
			</DialogPanel>
			{organizations && organizations.length > 0 && (
				<DialogFooter className="flex-row justify-end">
					<Button onClick={handleCreateNew}>
						<Plus className="mr-2 size-4" />
						Create New Organization
					</Button>
				</DialogFooter>
			)}
		</DialogPopup>
	);

	if (trigger) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger render={trigger as any} />
				{DialogContent}
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{DialogContent}
		</Dialog>
	);
}
