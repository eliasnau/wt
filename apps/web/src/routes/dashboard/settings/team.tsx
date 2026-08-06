import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from "@matdesk/ui/components/alert-dialog";
import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
} from "@matdesk/ui/components/card";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@matdesk/ui/components/dialog";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
	Menu,
	MenuItem,
	MenuPopup,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuTrigger,
} from "@matdesk/ui/components/menu";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@matdesk/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@matdesk/ui/components/table";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { MailIcon, MoreVerticalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { UserAvatar } from "@/components/auth/user-avatar";
import { RolePermissions } from "@/components/dashboard/settings/role-permissions";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/team")({
	component: RouteComponent,
});

const ROLE_LABELS: Record<string, string> = {
	owner: "Inhaber",
	admin: "Admin",
	member: "Mitglied",
};

function roleLabel(role: string) {
	return ROLE_LABELS[role] ?? role;
}

function RouteComponent() {
	const { activeOrganization, user, refetch } = useAuth();
	const [inviteOpen, setInviteOpen] = useState(false);
	const [removing, setRemoving] = useState<{ memberId: string; name: string } | null>(null);

	const members = activeOrganization?.members ?? [];
	const invitations = (activeOrganization?.invitations ?? []).filter(
		(i) => i.status === "pending",
	);

	const roleMutation = useMutation({
		mutationFn: async (vars: { memberId: string; role: "admin" | "member" | "owner" }) => {
			const { error } = await authClient.organization.updateMemberRole({
				memberId: vars.memberId,
				role: vars.role,
				organizationId: activeOrganization?.id,
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: async () => {
			toast.success("Rolle aktualisiert");
			await refetch();
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const removeMutation = useMutation({
		mutationFn: async (memberId: string) => {
			const { error } = await authClient.organization.removeMember({
				memberIdOrEmail: memberId,
				organizationId: activeOrganization?.id,
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: async () => {
			toast.success("Mitglied entfernt");
			await refetch();
			setRemoving(null);
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const cancelMutation = useMutation({
		mutationFn: async (invitationId: string) => {
			const { error } = await authClient.organization.cancelInvitation({ invitationId });
			if (error) throw new Error(error.message);
		},
		onSuccess: async () => {
			toast.success("Einladung zurückgezogen");
			await refetch();
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Team</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Mitglieder und Einladungen deiner Organisation.
				</p>
			</div>

			{/* Members */}
			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Mitglieder</CardFrameTitle>
					<CardFrameDescription>{members.length} Teammitglieder.</CardFrameDescription>
				</CardFrameHeader>
				<Table className="min-w-[560px]" variant="card">
					<TableHeader>
						<TableRow>
							<TableHead>Mitglied</TableHead>
							<TableHead>Rolle</TableHead>
							<TableHead>Beigetreten</TableHead>
							<TableHead className="w-px" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{members.map((member) => {
							const isSelf = member.userId === user?.id;
							return (
								<TableRow key={member.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<UserAvatar
												className="size-8"
												image={member.user.image}
												name={member.user.name}
												seed={member.userId}
											/>
											<div className="min-w-0">
												<p className="truncate font-medium text-foreground">
													{member.user.name}
													{isSelf ? <span className="text-muted-foreground"> (Du)</span> : null}
												</p>
												<p className="truncate text-muted-foreground text-xs">
													{member.user.email}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={member.role === "owner" ? "default" : "secondary"}>
											{roleLabel(member.role)}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(member.createdAt).toLocaleDateString("de-DE")}
									</TableCell>
									<TableCell className="w-px">
										{isSelf || member.role === "owner" ? null : (
											<div className="flex justify-end">
												<Menu>
													<MenuTrigger
														render={
															<Button aria-label="Aktionen" size="icon-sm" variant="outline">
																<MoreVerticalIcon />
															</Button>
														}
													/>
													<MenuPopup align="end">
														<MenuRadioGroup
															onValueChange={(value) =>
																roleMutation.mutate({
																	memberId: member.id,
																	role: value as "admin" | "member",
																})
															}
															value={member.role}
														>
															<MenuRadioItem value="admin">Admin</MenuRadioItem>
															<MenuRadioItem value="member">Mitglied</MenuRadioItem>
														</MenuRadioGroup>
														<MenuSeparator />
														<MenuItem
															onClick={() =>
																setRemoving({ memberId: member.id, name: member.user.name })
															}
															variant="destructive"
														>
															Entfernen
														</MenuItem>
													</MenuPopup>
												</Menu>
											</div>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardFrame>

			{/* Invitations */}
			<CardFrame>
				<CardFrameHeader>
					<CardFrameTitle>Einladungen</CardFrameTitle>
					<CardFrameDescription>Offene Einladungen ins Team.</CardFrameDescription>
					<div className="col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end">
						<Button onClick={() => setInviteOpen(true)} size="sm" variant="outline">
							<PlusIcon />
							Einladen
						</Button>
					</div>
				</CardFrameHeader>
				<Table className="min-w-[480px]" variant="card">
					<TableHeader>
						<TableRow>
							<TableHead>E-Mail</TableHead>
							<TableHead>Rolle</TableHead>
							<TableHead className="w-px" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{invitations.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell className="py-8 text-center text-muted-foreground" colSpan={3}>
									Keine offenen Einladungen.
								</TableCell>
							</TableRow>
						) : (
							invitations.map((invitation) => (
								<TableRow key={invitation.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											<MailIcon className="size-4 text-muted-foreground" />
											<span className="font-medium text-foreground">{invitation.email}</span>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{roleLabel(invitation.role)}
									</TableCell>
									<TableCell className="w-px">
										<div className="flex justify-end">
											<Button
												loading={cancelMutation.isPending}
												onClick={() => cancelMutation.mutate(invitation.id)}
												size="sm"
												variant="ghost"
											>
												Zurückziehen
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardFrame>

			<RolePermissions />

			<InviteDialog
				onOpenChange={setInviteOpen}
				onSuccess={refetch}
				open={inviteOpen}
				organizationId={activeOrganization?.id}
			/>

			<AlertDialog
				onOpenChange={(open) => {
					if (!open) setRemoving(null);
				}}
				open={Boolean(removing)}
			>
				<AlertDialogPopup>
					<AlertDialogHeader>
						<AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
						<AlertDialogDescription>
							„{removing?.name}" verliert den Zugriff auf diese Organisation.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
						<Button
							loading={removeMutation.isPending}
							onClick={() => removing && removeMutation.mutate(removing.memberId)}
							variant="destructive"
						>
							Entfernen
						</Button>
					</AlertDialogFooter>
				</AlertDialogPopup>
			</AlertDialog>
		</div>
	);
}

function InviteDialog({
	open,
	onOpenChange,
	organizationId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string | undefined;
	onSuccess: () => Promise<unknown>;
}) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin">("member");

	const mutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.organization.inviteMember({
				email: email.trim(),
				role,
				organizationId,
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: async () => {
			toast.success("Einladung gesendet");
			await onSuccess();
			onOpenChange(false);
			setEmail("");
			setRole("member");
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogPopup className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Mitglied einladen</DialogTitle>
					<DialogDescription>Lade per E-Mail ins Team ein.</DialogDescription>
				</DialogHeader>
				<Form
					className="contents"
					onSubmit={(e) => {
						e.preventDefault();
						mutation.mutate();
					}}
				>
					<DialogPanel className="grid gap-4">
						<Field>
							<FieldLabel>E-Mail</FieldLabel>
							<Input
								onChange={(e) => setEmail(e.target.value)}
								placeholder="name@beispiel.de"
								type="email"
								value={email}
							/>
						</Field>
						<Field>
							<FieldLabel>Rolle</FieldLabel>
							<Select
								items={[
									{ value: "member", label: "Mitglied" },
									{ value: "admin", label: "Admin" },
								]}
								onValueChange={(value) => value && setRole(value as "member" | "admin")}
								value={role}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectPopup>
									<SelectItem value="member">Mitglied</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectPopup>
							</Select>
						</Field>
					</DialogPanel>
					<DialogFooter>
						<DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
						<Button disabled={!email.trim()} loading={mutation.isPending} type="submit">
							Einladen
						</Button>
					</DialogFooter>
				</Form>
			</DialogPopup>
		</Dialog>
	);
}
