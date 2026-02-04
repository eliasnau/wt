"use client";

import { useState } from "react";
import { ChevronDownIcon, Lock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import {
	Empty,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyHeader,
	EmptyContent,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@repo/auth/client";
import type { PermissionCheck } from "@repo/auth/permissions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { builtinRolePermissions, defaultRoleNames } from "./role-utils";
import { useOrgRoles, type OrganizationRole } from "./use-org-roles";
import { RoleSummaryCard } from "./role-summary-card";
import { RoleEditorDialog } from "./role-editor-dialog";
import { RoleDeleteDialog } from "./role-delete-dialog";
import { RolePreviewDialog } from "./role-preview-dialog";

export function RolesPermissionsSection() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const {
		dynamicRoles,
		isPending,
		error,
		refetch,
	} = useOrgRoles();
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<OrganizationRole | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletingRole, setDeletingRole] = useState<OrganizationRole | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewRole, setPreviewRole] = useState<{
		roleName: string;
		permissions: PermissionCheck;
	} | null>(null);

	const permissionQuery = useQuery({
		queryKey: ["organization-role-permissions", activeOrg?.id],
		retry: 1,
		enabled: !!activeOrg,
		queryFn: async () => {
			const check = async (action: "create" | "read" | "update" | "delete") => {
				const result = await authClient.organization.hasPermission({
					permissions: { ac: [action] },
				});
				if (result.error) return false;
				return result.data?.success ?? false;
			};

			const [canCreate, canRead, canUpdate, canDelete] = await Promise.all([
				check("create"),
				check("read"),
				check("update"),
				check("delete"),
			]);

			return { canCreate, canRead, canUpdate, canDelete };
		},
	});

	const deleteRoleMutation = useMutation({
		mutationFn: async (role: OrganizationRole) => {
			const result = await authClient.organization.deleteRole({
				roleId: role.id,
				roleName: role.role,
				organizationId: activeOrg?.id,
			});
			if (result.error) {
				throw new Error(result.error.message || "Failed to delete role");
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Role deleted");
			refetch();
			setDeleteOpen(false);
			setDeletingRole(null);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete role",
			);
			setDeleteOpen(false);
			setDeletingRole(null);
		},
	});

	const canCreate = permissionQuery.data?.canCreate ?? false;
	const canUpdate = permissionQuery.data?.canUpdate ?? false;
	const canDelete = permissionQuery.data?.canDelete ?? false;
	const canRead = permissionQuery.data?.canRead ?? false;

	const openCreateDialog = () => {
		setEditingRole(null);
		setEditorOpen(true);
	};

	const openEditDialog = (role: OrganizationRole) => {
		setEditingRole(role);
		setEditorOpen(true);
	};

	const openDeleteDialog = (role: OrganizationRole) => {
		setDeletingRole(role);
		setDeleteOpen(true);
	};

	const handleDelete = () => {
		if (!deletingRole) return;
		deleteRoleMutation.mutate(deletingRole);
	};

	const openPreviewDialog = (roleName: string, permissions: PermissionCheck) => {
		setPreviewRole({ roleName, permissions });
		setPreviewOpen(true);
	};

	const customRoleCards = canRead
		? dynamicRoles.map((role) => (
				<RoleSummaryCard
					key={role.id}
					roleName={role.role}
					permission={(role.permission ?? undefined) as PermissionCheck}
					canEdit={canUpdate}
					canDelete={canDelete}
					onView={() =>
						openPreviewDialog(
							role.role,
							(role.permission ?? {}) as PermissionCheck,
						)
					}
					onEdit={() => openEditDialog(role)}
					onDelete={() => openDeleteDialog(role)}
				/>
			))
		: [];

	const builtInRoleCards = defaultRoleNames.map((roleName) => (
		<RoleSummaryCard
			key={roleName}
			roleName={roleName}
			permission={builtinRolePermissions[roleName]}
			isSystem
			onView={() =>
				openPreviewDialog(roleName, builtinRolePermissions[roleName])
			}
		/>
	));

	const showCustomEmpty = !isPending && !error && canRead && customRoleCards.length === 0;

	return (
		<Frame className="w-full">
			<Collapsible defaultOpen={false}>
				<FrameHeader className="flex-row items-center justify-between px-2 py-2">
					<CollapsibleTrigger
						className="data-panel-open:[&_svg]:rotate-180"
						render={<Button variant="ghost" />}
					>
						<ChevronDownIcon className="size-4" />
						Roles & Permissions
						{dynamicRoles.length > 0 && (
							<Badge variant="outline" className="ml-2">
								{dynamicRoles.length}
							</Badge>
						)}
					</CollapsibleTrigger>
				</FrameHeader>
				<CollapsiblePanel>
					<FramePanel>
						<div className="flex flex-col gap-6">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<div className="text-sm font-semibold">
										Roles
									</div>
									<div className="text-sm text-muted-foreground">
										Create roles with tailored permissions and review built-in
										access.
									</div>
								</div>
								<Button
									onClick={openCreateDialog}
									disabled={!canCreate}
								>
									New role
								</Button>
							</div>

							{!canCreate && (
								<div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
									<Lock className="size-3" />
									Only admins with role management permissions can create
									custom roles.
								</div>
							)}

							{isPending && (
								<div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
									Loading roles...
								</div>
							)}

							{!isPending && error && (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Settings2 />
										</EmptyMedia>
										<EmptyTitle>Roles unavailable</EmptyTitle>
										<EmptyDescription>
											We couldn't load custom roles right now.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button variant="outline" onClick={() => refetch()}>
											Try again
										</Button>
									</EmptyContent>
								</Empty>
							)}

							{!isPending && !error && !canRead && (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Settings2 />
										</EmptyMedia>
										<EmptyTitle>Roles unavailable</EmptyTitle>
										<EmptyDescription>
											You don't have permission to view custom roles.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}

							{showCustomEmpty && (
								<Empty>
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Settings2 />
										</EmptyMedia>
										<EmptyTitle>No custom roles</EmptyTitle>
										<EmptyDescription>
											Create a new role to start assigning tailored
											permissions.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}

							<div className="grid gap-3">
								{customRoleCards}
								{builtInRoleCards}
							</div>
						</div>
					</FramePanel>
				</CollapsiblePanel>
			</Collapsible>

			<RoleEditorDialog
				open={editorOpen}
				onOpenChange={setEditorOpen}
				mode={editingRole ? "edit" : "create"}
				role={editingRole}
			/>

			<RoleDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				roleName={deletingRole?.role}
				onConfirm={handleDelete}
				loading={deleteRoleMutation.isPending}
			/>

			<RolePreviewDialog
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				roleName={previewRole?.roleName}
				permissions={previewRole?.permissions}
			/>
		</Frame>
	);
}
