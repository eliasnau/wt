import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@matdesk/ui/components/alert-dialog";
import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
	Card,
	CardFrame,
	CardFrameDescription,
	CardFrameHeader,
	CardFrameTitle,
	CardPanel,
} from "@matdesk/ui/components/card";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@matdesk/ui/components/select";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { UserAvatar } from "@/components/auth/user-avatar";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/admin/users/$userId")({
	component: RouteComponent,
});

function SettingRow({
	label,
	description,
	children,
}: {
	label: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
			<div className="min-w-0 space-y-0.5">
				<p className="font-medium text-sm">{label}</p>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>
			{children}
		</div>
	);
}

function InfoField({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-0.5">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="break-all text-foreground text-sm">{value}</p>
		</div>
	);
}

function RouteComponent() {
	const { userId } = Route.useParams();
	const navigate = useNavigate();
	const [resetOpen, setResetOpen] = useState(false);

	const userQuery = useQuery({
		queryKey: ["admin", "user", userId],
		queryFn: async () => {
			const { data, error } = await authClient.admin.getUser({ query: { id: userId } });
			if (error) throw new Error(error.message);
			return data;
		},
	});

	const user = userQuery.data;

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
		queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
	}

	const roleMutation = useMutation({
		mutationFn: async (role: "user" | "admin") => {
			const { error } = await authClient.admin.setRole({ userId, role });
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("Rolle aktualisiert");
			invalidate();
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const banMutation = useMutation({
		mutationFn: async (banned: boolean) => {
			const { error } = banned
				? await authClient.admin.unbanUser({ userId })
				: await authClient.admin.banUser({ userId });
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("Benutzer aktualisiert");
			invalidate();
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const revokeMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.admin.revokeUserSessions({ userId });
			if (error) throw new Error(error.message);
		},
		onSuccess: () => toast.success("Alle Sitzungen widerrufen"),
		onError: (error) => toast.error(parseError(error).message),
	});

	const impersonateMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.admin.impersonateUser({ userId });
			if (error) throw new Error(error.message);
		},
		// Impersonation swaps the session cookie — hard reload to pick it up.
		onSuccess: () => {
			window.location.href = "/dashboard";
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.admin.removeUser({ userId });
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("Benutzer gelöscht");
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			navigate({ to: "/admin/users" });
		},
		onError: (error) => toast.error(parseError(error).message),
	});

	return (
		<div className="flex flex-col gap-6">
			<Button
				className="-ml-2 self-start text-muted-foreground"
				render={<Link to="/admin/users" />}
				size="sm"
				variant="ghost"
			>
				<ArrowLeftIcon />
				Benutzer
			</Button>

			{userQuery.isPending ? (
				<div className="flex items-center gap-4">
					<Skeleton className="size-14 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
			) : userQuery.isError ? (
				<p className="text-muted-foreground text-sm">{parseError(userQuery.error).message}</p>
			) : user ? (
				<>
					<div className="flex items-center gap-4">
						<UserAvatar className="size-14" image={user.image} name={user.name} seed={user.id} />
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
								{user.banned ? <Badge variant="destructive">Gesperrt</Badge> : null}
								<Badge variant={user.role === "admin" ? "default" : "secondary"}>
									{user.role ?? "user"}
								</Badge>
							</div>
							<p className="truncate text-muted-foreground">{user.email}</p>
						</div>
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						<div className="flex flex-col gap-6 lg:col-span-2">
							<CardFrame>
								<CardFrameHeader>
									<CardFrameTitle>Konto</CardFrameTitle>
									<CardFrameDescription>Rolle, Zugriff und Sitzungen verwalten.</CardFrameDescription>
								</CardFrameHeader>
								<Card>
									<CardPanel className="flex flex-col divide-y">
									<SettingRow
										description="Admins haben Zugriff auf dieses Admin-Panel."
										label="Plattform-Rolle"
									>
										<Select
											disabled={roleMutation.isPending}
											items={[
												{ label: "Benutzer", value: "user" },
												{ label: "Admin", value: "admin" },
											]}
											onValueChange={(value) => roleMutation.mutate(value as "user" | "admin")}
											value={user.role ?? "user"}
										>
											<SelectTrigger className="w-36" size="sm">
												<SelectValue />
											</SelectTrigger>
											<SelectPopup alignItemWithTrigger={false}>
												<SelectItem value="user">Benutzer</SelectItem>
												<SelectItem value="admin">Admin</SelectItem>
											</SelectPopup>
										</Select>
									</SettingRow>

									<SettingRow
										description={user.banned ? "Benutzer ist gesperrt." : "Benutzer ist aktiv."}
										label="Sperrstatus"
									>
										<Button
											loading={banMutation.isPending}
											onClick={() => banMutation.mutate(Boolean(user.banned))}
											size="sm"
											variant={user.banned ? "outline" : "destructive-outline"}
										>
											{user.banned ? "Entsperren" : "Sperren"}
										</Button>
									</SettingRow>

									<SettingRow description="Lege ein neues Passwort fest." label="Passwort">
										<Button onClick={() => setResetOpen(true)} size="sm" variant="outline">
											Zurücksetzen
										</Button>
									</SettingRow>

									<SettingRow description="Alle aktiven Sitzungen beenden." label="Sitzungen">
										<Button
											loading={revokeMutation.isPending}
											onClick={() => revokeMutation.mutate()}
											size="sm"
											variant="outline"
										>
											Widerrufen
										</Button>
									</SettingRow>

									<SettingRow description="Als dieser Benutzer anmelden." label="Impersonieren">
										<Button
											loading={impersonateMutation.isPending}
											onClick={() => impersonateMutation.mutate()}
											size="sm"
											variant="outline"
										>
											Impersonieren
										</Button>
									</SettingRow>
									</CardPanel>
								</Card>
							</CardFrame>

							<CardFrame className="border-destructive/30">
								<CardFrameHeader>
									<CardFrameTitle>Gefahrenzone</CardFrameTitle>
									<CardFrameDescription>
										Den Benutzer dauerhaft löschen. Diese Aktion kann nicht rückgängig gemacht
										werden.
									</CardFrameDescription>
								</CardFrameHeader>
								<Card>
									<CardPanel>
									<AlertDialog>
										<AlertDialogTrigger render={<Button variant="destructive-outline" />}>
											Benutzer löschen
										</AlertDialogTrigger>
										<AlertDialogPopup>
											<AlertDialogHeader>
												<AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
												<AlertDialogDescription>
													{user.name} ({user.email}) wird dauerhaft entfernt.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogClose render={<Button variant="ghost" />}>
													Abbrechen
												</AlertDialogClose>
												<Button
													loading={deleteMutation.isPending}
													onClick={() => deleteMutation.mutate()}
													variant="destructive"
												>
													Löschen
												</Button>
											</AlertDialogFooter>
										</AlertDialogPopup>
									</AlertDialog>
									</CardPanel>
								</Card>
							</CardFrame>
						</div>

						<CardFrame className="h-fit">
							<CardFrameHeader>
								<CardFrameTitle>Details</CardFrameTitle>
							</CardFrameHeader>
							<Card>
								<CardPanel className="flex flex-col gap-4">
									<InfoField label="User-ID" value={user.id} />
									<InfoField label="E-Mail verifiziert" value={user.emailVerified ? "Ja" : "Nein"} />
									<InfoField
										label="Erstellt"
										value={new Date(user.createdAt).toLocaleString("de-DE")}
									/>
									{user.banned ? (
										<InfoField label="Sperrgrund" value={user.banReason || "—"} />
									) : null}
								</CardPanel>
							</Card>
						</CardFrame>
					</div>

					<ResetPasswordDialog onOpenChange={setResetOpen} open={resetOpen} userId={userId} />
				</>
			) : (
				<p className="text-muted-foreground text-sm">Benutzer nicht gefunden.</p>
			)}
		</div>
	);
}
