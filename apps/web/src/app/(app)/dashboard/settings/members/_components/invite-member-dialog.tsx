"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { authClient } from "@repo/auth/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
};

export function InviteMemberDialog({
	open,
	onOpenChange,
}: InviteMemberDialogProps) {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const queryClient = useQueryClient();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin" | "owner">("member");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!email.trim()) {
			toast.error("Email is required");
			return;
		}

		setLoading(true);
		const result = await authClient.organization.inviteMember({
			email,
			role,
		});
		setLoading(false);

		if (result.error) {
			toast.error(result.error.message || "Failed to send invitation");
			return;
		}

		toast.success("Invitation sent");
		onOpenChange(false);
		setEmail("");
		setRole("member");
		// Refetch members list
		queryClient.invalidateQueries({
			queryKey: ["organization-members", activeOrg?.id],
		});
	};

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
								onChange={(e) => setEmail(e.target.value)}
								placeholder="colleague@example.com"
								autoFocus
							/>
						</Field>
						<Field>
							<FieldLabel>Role</FieldLabel>
							<Select
								value={role}
								onValueChange={(value) =>
									value && setRole(value as "member" | "admin" | "owner")
								}
							>
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
					<Button onClick={handleSubmit} disabled={loading || !email.trim()}>
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
