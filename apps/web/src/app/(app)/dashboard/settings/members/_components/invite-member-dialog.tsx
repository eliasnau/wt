import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type InviteMemberDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	email: string;
	onEmailChange: (email: string) => void;
	role: string;
	onRoleChange: (role: string) => void;
	onSubmit: () => void;
	loading: boolean;
};

export function InviteMemberDialog({
	open,
	onOpenChange,
	email,
	onEmailChange,
	role,
	onRoleChange,
	onSubmit,
	loading,
}: InviteMemberDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogHeader>
					<DialogTitle>Invite Team Member</DialogTitle>
				</DialogHeader>
				<DialogPanel>
					<div className="space-y-4">
						<Field>
							<FieldLabel>Email Address</FieldLabel>
							<Input
								type="email"
								value={email}
								onChange={(e) => onEmailChange(e.target.value)}
								placeholder="colleague@example.com"
								autoFocus
							/>
						</Field>
						<Field>
							<FieldLabel>Role</FieldLabel>
							<Select value={role} onValueChange={onRoleChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="member">Member</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="owner">Owner</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					</div>
				</DialogPanel>
				<DialogFooter>
					<DialogClose render={<Button variant="ghost" />} disabled={loading}>
						Cancel
					</DialogClose>
					<Button onClick={onSubmit} disabled={loading || !email.trim()}>
						{loading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Sending...
							</>
						) : (
							"Send Invitation"
						)}
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
