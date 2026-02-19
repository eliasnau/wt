"use client";

import { authClient } from "@repo/auth/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RolePermissionGrid } from "./role-permission-grid";
import {
	defaultRoleNames,
	formatRoleLabel,
	normalizePermissions,
	type PermissionMap,
} from "./role-utils";
import type { OrganizationRole } from "./use-org-roles";

const EMPTY_PERMISSIONS: PermissionMap = {};

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
	const [permissions, setPermissions] = useState<PermissionMap>({});

	const [prevDeps, setPrevDeps] = useState(() => ({ open: false, mode, role }));

	if (
		open !== prevDeps.open ||
		mode !== prevDeps.mode ||
		role !== prevDeps.role
	) {
		setPrevDeps({ open, mode, role });
		if (open) {
			if (mode === "edit" && role) {
				setRoleName(role.role ?? "");
				setPermissions((role.permission ?? {}) as PermissionMap);
			} else {
				setRoleName("");
				setPermissions(EMPTY_PERMISSIONS);
			}
		}
	}

	const isEditing = mode === "edit";
	const title = isEditing
		? `Edit ${formatRoleLabel(roleName || "Rolle")}`
		: "Rolle erstellen";
	const description = isEditing
		? "Aktualisiere den Rollennamen und passe die Berechtigungen für diese Teamrolle fein an."
		: "Erstelle eine benutzerdefinierte Rolle mit genau den Berechtigungen, die dein Team benötigt.";

	const mutation = useMutation({
		mutationFn: async () => {
			const trimmedName = roleName.trim();
			if (!trimmedName) {
				throw new Error("Rollenname ist erforderlich");
			}
			if (defaultRoleNames.includes(trimmedName)) {
				throw new Error("Rollenname ist reserviert");
			}
			const normalized = normalizePermissions(permissions);
			if (isEditing) {
				const result = await authClient.organization.updateRole({
					roleId: role?.id,
					roleName: role?.role,
					organizationId: activeOrg?.id,
					data: {
						permission: normalized,
						roleName: trimmedName,
					},
				});
				if (result.error) {
					throw new Error(
						result.error.message || "Rolle konnte nicht aktualisiert werden",
					);
				}
				return result.data;
			}

			const result = await authClient.organization.createRole({
				role: trimmedName,
				permission: normalized,
				organizationId: activeOrg?.id,
			});
			if (result.error) {
				throw new Error(
					result.error.message || "Rolle konnte nicht erstellt werden",
				);
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success(isEditing ? "Rolle aktualisiert" : "Rolle erstellt");
			queryClient.invalidateQueries({
				queryKey: ["organization-roles", activeOrg?.id],
			});
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Etwas ist schiefgelaufen",
			);
		},
	});

	const actionLabel = useMemo(() => {
		if (mutation.isPending) {
			return isEditing ? "Speichern..." : "Creating...";
		}
		return isEditing ? "Änderungen speichern" : "Rolle erstellen";
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
							<FieldLabel>Rollenname</FieldLabel>
							<Input
								value={roleName}
								onChange={(event) => setRoleName(event.target.value)}
								placeholder="e.g. Billing Manager"
								autoFocus
							/>
							<p className="text-muted-foreground text-xs">
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
							<div className="mb-3 font-semibold text-sm">Permissions</div>
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
					<Button onClick={() => mutation.mutate()} disabled={isSubmitDisabled}>
						{mutation.isPending && <Loader2 className="size-4 animate-spin" />}
						{actionLabel}
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
