"use client";

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
import { formatRoleLabel, type PermissionMap } from "./role-utils";
import { RolePermissionGrid } from "./role-permission-grid";

export type RolePreviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roleName?: string;
	permissions?: PermissionMap | null;
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
						{roleName ? formatRoleLabel(roleName) : "Rolle"} permissions
					</DialogTitle>
					<DialogDescription>
						Review the permissions included in this role.
					</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<RolePermissionGrid
						value={(permissions ?? {}) as PermissionMap}
						onChange={() => undefined}
						disabled
						grouped
					/>
				</DialogPanel>
				<DialogFooter variant="bare">
					<DialogClose render={<Button variant="outline" />}>Schließen</DialogClose>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
