import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogPopup,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RoleChangeDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	memberName?: string;
	currentRole?: string;
	newRole?: string;
	onConfirm: () => void;
	loading: boolean;
};

export function RoleChangeDialog({
	open,
	onOpenChange,
	memberName,
	currentRole,
	newRole,
	onConfirm,
	loading,
}: RoleChangeDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
					<AlertDialogDescription>
						Change {memberName}'s role from{" "}
						<strong className="capitalize">{currentRole}</strong> to{" "}
						<strong className="capitalize">{newRole}</strong>?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={<Button variant="ghost" />}
						disabled={loading}
					>
						Cancel
					</AlertDialogClose>
					<Button onClick={onConfirm} disabled={loading}>
						{loading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Updating...
							</>
						) : (
							"Confirm"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}

type RemoveMemberDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	memberName?: string;
	onConfirm: () => void;
	loading: boolean;
};

export function RemoveMemberDialog({
	open,
	onOpenChange,
	memberName,
	onConfirm,
	loading,
}: RemoveMemberDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove Member</AlertDialogTitle>
					<AlertDialogDescription>
						Remove <strong>{memberName}</strong> from the organization? They
						will lose access immediately.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={<Button variant="ghost" />}
						disabled={loading}
					>
						Cancel
					</AlertDialogClose>
					<Button onClick={onConfirm} disabled={loading} variant="destructive">
						{loading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Removing...
							</>
						) : (
							"Remove"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}

type CancelInvitationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	email?: string;
	onConfirm: () => void;
	loading: boolean;
};

export function CancelInvitationDialog({
	open,
	onOpenChange,
	email,
	onConfirm,
	loading,
}: CancelInvitationDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
					<AlertDialogDescription>
						Cancel invitation for <strong>{email}</strong>? They will not be
						able to join using this invitation.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={<Button variant="ghost" />}
						disabled={loading}
					>
						Cancel
					</AlertDialogClose>
					<Button onClick={onConfirm} disabled={loading} variant="destructive">
						{loading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Cancelling...
							</>
						) : (
							"Cancel Invitation"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}
