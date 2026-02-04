"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@repo/auth/client";
import type { PermissionCheck } from "@repo/auth/permissions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Info } from "lucide-react";
import {
	defaultRoleNames,
	formatRoleLabel,
	normalizePermissions,
} from "./role-utils";
import { RolePermissionGrid } from "./role-permission-grid";
import type { OrganizationRole } from "./use-org-roles";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EMPTY_PERMISSIONS: PermissionCheck = {};

type RoleEditorDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	role?: OrganizationRole | null;
};

export function RoleEditorDialog({
	open,
	onOpenChange,
	mode,
	role,
}: RoleEditorDialogProps) {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const queryClient = useQueryClient();
	const [roleName, setRoleName] = useState("");
	const [permissions, setPermissions] = useState<PermissionCheck>({});

	useEffect(() => {
		if (!open) return;
		if (mode === "edit" && role) {
			setRoleName(role.role ?? "");
			setPermissions((role.permission ?? {}) as PermissionCheck);
			return;
		}
		setRoleName("");
		setPermissions(EMPTY_PERMISSIONS);
	}, [open, mode, role]);

	const isEditing = mode === "edit";
	const title = isEditing ? `Edit ${formatRoleLabel(roleName || "Role")}` : "Create Role";
	const description = isEditing
		? "Update the role name and fine-tune permissions for this team role."
		: "Create a custom role with just the permissions your team needs.";

	const mutation = useMutation({
		mutationFn: async () => {
			const trimmedName = roleName.trim();
			if (!trimmedName) {
				throw new Error("Role name is required");
			}
			if (defaultRoleNames.includes(trimmedName)) {
				throw new Error("Role name is reserved");
			}
			const normalized = normalizePermissions(permissions);
			if (isEditing) {
				const result = await authClient.organization.updateRole({
					roleId: role?.id,
					roleName: role?.role,
					organizationId: activeOrg?.id,
					data: {
						permission: Object.keys(normalized).length
							? (normalized as Record<string, string[]>)
							: undefined,
						roleName: trimmedName,
					},
				});
				if (result.error) {
					throw new Error(result.error.message || "Failed to update role");
				}
				return result.data;
			}

			const result = await authClient.organization.createRole({
				role: trimmedName,
				permission: Object.keys(normalized).length
					? (normalized as Record<string, string[]>)
					: undefined,
				organizationId: activeOrg?.id,
			});
			if (result.error) {
				throw new Error(result.error.message || "Failed to create role");
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success(isEditing ? "Role updated" : "Role created");
			queryClient.invalidateQueries({
				queryKey: ["organization-roles", activeOrg?.id],
			});
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Something went wrong",
			);
		},
	});

	const actionLabel = useMemo(() => {
		if (mutation.isPending) {
			return isEditing ? "Saving..." : "Creating...";
		}
		return isEditing ? "Save changes" : "Create role";
	}, [mutation.isPending, isEditing]);

	const isSubmitDisabled = mutation.isPending || !roleName.trim();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<div className="space-y-6">
						<Field>
							<FieldLabel>Role name</FieldLabel>
							<Input
								value={roleName}
								onChange={(event) => setRoleName(event.target.value)}
								placeholder="e.g. Billing Manager"
								autoFocus
							/>
							<p className="text-xs text-muted-foreground">
								Use a unique name. Built-in roles are reserved.
							</p>
						</Field>

						<Alert variant="info">
							<Info />
							<AlertDescription>
								You can only grant permissions that your current role already
								allows.
							</AlertDescription>
						</Alert>

						<div>
							<div className="mb-3 text-sm font-semibold">
								Permissions
							</div>
							<RolePermissionGrid
								value={permissions}
								onChange={setPermissions}
								disabled={mutation.isPending}
								grouped
							/>
						</div>
					</div>
				</DialogPanel>
				<DialogFooter>
					<DialogClose
						render={<Button variant="ghost" />}
						disabled={mutation.isPending}
					>
						Cancel
					</DialogClose>
					<Button
						onClick={() => mutation.mutate()}
						disabled={isSubmitDisabled}
					>
						{mutation.isPending && (
							<Loader2 className="size-4 animate-spin" />
						)}
						{actionLabel}
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
