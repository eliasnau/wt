"use client";

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
import { formatRoleLabel } from "./role-utils";
import { RolePermissionGrid } from "./role-permission-grid";

export type RolePreviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roleName?: string;
	permissions?: PermissionCheck | null;
};

export function RolePreviewDialog({
	open,
	onOpenChange,
	roleName,
	permissions,
}: RolePreviewDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogHeader>
					<DialogTitle>
						{roleName ? formatRoleLabel(roleName) : "Role"} permissions
					</DialogTitle>
					<DialogDescription>
						Review the permissions included in this role.
					</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<RolePermissionGrid
						value={(permissions ?? {}) as PermissionCheck}
						onChange={() => undefined}
						disabled
						grouped
					/>
				</DialogPanel>
				<DialogFooter variant="bare">
					<DialogClose render={<Button variant="outline" />}>Close</DialogClose>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
