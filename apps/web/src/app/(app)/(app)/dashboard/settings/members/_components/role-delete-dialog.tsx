"use client";

import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatRoleLabel } from "./role-utils";

export type RoleDeleteDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roleName?: string;
	onConfirm: () => void;
	loading: boolean;
};

export function RoleDeleteDialog({
	open,
	onOpenChange,
	roleName,
	onConfirm,
	loading,
}: RoleDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Rolle löschen</AlertDialogTitle>
					<AlertDialogDescription>
						Delete the {roleName ? formatRoleLabel(roleName) : "selected"} role?
						Members assigned to it will lose access tied to those permissions.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={<Button variant="ghost" />}
						disabled={loading}
					>
						Cancel
					</AlertDialogClose>
					<Button variant="destructive" onClick={onConfirm} disabled={loading}>
						{loading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Deleting...
							</>
						) : (
							"Rolle löschen"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}
