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
import { formatRoleLabel } from "./role-utils";
import { useOrgRoles } from "./use-org-roles";

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
	const { roleOptions } = useOrgRoles();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!email.trim()) {
			toast.error("E-Mail ist erforderlich");
			return;
		}

		setLoading(true);
		const result = await authClient.organization.inviteMember({
			email,
			role: role as "member" | "owner" | "admin",
		});
		setLoading(false);

		if (result.error) {
			toast.error(result.error.message || "Einladung konnte nicht gesendet werden");
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
					<DialogTitle>Teammitglied einladen</DialogTitle>
				</DialogHeader>
				<DialogPanel>
					<div className="space-y-4">
						<Field>
							<FieldLabel>E-Mail-Adresse</FieldLabel>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="colleague@example.com"
								autoFocus
							/>
						</Field>
						<Field>
							<FieldLabel>Rolle</FieldLabel>
							<Select
								value={role}
								onValueChange={(value) => value && setRole(value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{roleOptions.map((roleOption) => (
										<SelectItem key={roleOption} value={roleOption}>
											{formatRoleLabel(roleOption)}
										</SelectItem>
									))}
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
