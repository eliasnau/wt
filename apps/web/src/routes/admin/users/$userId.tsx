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
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
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
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { Textarea } from "@matdesk/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  LogInIcon,
  ShieldCheckIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { OrganizationAvatar } from "@/components/auth/organization-avatar";
import { UserAvatar } from "@/components/auth/user-avatar";
import { authClient } from "@/lib/auth-client";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/admin/users/$userId")({
  component: RouteComponent,
});

function roleBadgeVariant(role: string) {
  if (role === "owner") return "default" as const;
  if (role === "admin") return "secondary" as const;
  return "outline" as const;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("de-DE");
}

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE");
}

function userAgentLabel(userAgent?: string | null) {
  if (!userAgent) return "Unbekanntes Gerät";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  return userAgent.slice(0, 72);
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="break-all text-foreground text-sm">{value}</p>
    </div>
  );
}

function BanUserDialog({
  open,
  onOpenChange,
  loading,
  userName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  userName: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setReason("");
      }}
      open={open}
    >
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Benutzer sperren</DialogTitle>
          <DialogDescription>
            Gib einen internen Sperrgrund für {userName} an. Der Benutzer kann sich danach nicht
            mehr anmelden.
          </DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(reason);
          }}
        >
          <DialogPanel>
            <Field>
              <FieldLabel>Sperrgrund</FieldLabel>
              <Textarea
                autoFocus
                onChange={(event) => setReason(event.target.value)}
                placeholder="z. B. Missbrauch, Zahlungsausfall, Sicherheitsprüfung"
                value={reason}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button
              disabled={reason.trim().length === 0}
              loading={loading}
              type="submit"
              variant="destructive"
            >
              Sperren
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}

function RouteComponent() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);

  const profileOptions = orpc.admin.users.get.queryOptions({ input: { userId } });
  const profileQuery = useQuery(profileOptions);

  const profile = profileQuery.data;
  const user = profile?.user;
  const organizations = profile?.organizations ?? [];
  const activeSessions = profile?.activeSessions ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: profileOptions.queryKey });
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
    mutationFn: async (reason: string) => {
      const { error } = await authClient.admin.banUser({
        userId,
        banReason: reason.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Benutzer gesperrt");
      setBanOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const unbanMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.admin.unbanUser({ userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Benutzer entsperrt");
      invalidate();
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.admin.revokeUserSessions({ userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Alle Sitzungen widerrufen");
      invalidate();
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const removeMembershipMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      await orpc.admin.organizations.removeMember.call({ organizationId, userId });
    },
    onSuccess: () => {
      toast.success("Benutzer aus Organisation entfernt");
      invalidate();
    },
    onError: (error) => toast.error(parseError(error).message),
  });

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.admin.impersonateUser({ userId });
      if (error) throw new Error(error.message);
    },
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

      {profileQuery.isPending ? (
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      ) : profileQuery.isError ? (
        <p className="text-muted-foreground text-sm">{parseError(profileQuery.error).message}</p>
      ) : user ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <UserAvatar className="size-14" image={user.image} name={user.name} seed={user.id} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
                  {user.role === "admin" ? <Badge>Admin</Badge> : null}
                  {user.banned ? <Badge variant="destructive">Gesperrt</Badge> : null}
                  {user.twoFactorEnabled ? (
                    <Badge variant="success">
                      <ShieldCheckIcon />
                      2FA
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setResetOpen(true)} size="sm" variant="outline">
                <KeyRoundIcon />
                Passwort
              </Button>
              <Button
                loading={impersonateMutation.isPending}
                onClick={() => impersonateMutation.mutate()}
                size="sm"
                variant="outline"
              >
                <LogInIcon />
                Impersonieren
              </Button>
              {user.banned ? (
                <Button
                  loading={unbanMutation.isPending}
                  onClick={() => unbanMutation.mutate()}
                  size="sm"
                  variant="outline"
                >
                  Entsperren
                </Button>
              ) : (
                <Button onClick={() => setBanOpen(true)} size="sm" variant="destructive-outline">
                  <BanIcon />
                  Sperren
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="flex flex-col gap-6 xl:col-span-2">
              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>Organisationen</CardFrameTitle>
                  <CardFrameDescription>
                    {organizations.length} Mitgliedschaften dieses Benutzers.
                  </CardFrameDescription>
                </CardFrameHeader>
                <Table className="min-w-[560px]" variant="card">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead className="text-right">Beigetreten</TableHead>
                      <TableHead className="w-px" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.length === 0 ? (
                      <TableRow>
                        <TableCell className="py-8 text-center text-muted-foreground" colSpan={4}>
                          Keine Organisationsmitgliedschaften.
                        </TableCell>
                      </TableRow>
                    ) : (
                      organizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell>
                            <Link
                              className="flex items-center gap-3 hover:underline"
                              params={{ orgId: org.id }}
                              to="/admin/organizations/$orgId"
                            >
                              <OrganizationAvatar
                                className="size-8 rounded-lg"
                                id={org.id}
                                logo={org.logo}
                                name={org.name}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{org.name}</p>
                                <p className="truncate text-muted-foreground text-xs">{org.slug}</p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariant(org.role)}>{org.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatShortDate(org.joinedAt)}
                          </TableCell>
                          <TableCell className="w-px">
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    aria-label={`${user.name} aus ${org.name} entfernen`}
                                    size="icon-sm"
                                    variant="ghost"
                                  />
                                }
                              >
                                <Trash2Icon className="text-destructive" />
                              </AlertDialogTrigger>
                              <AlertDialogPopup>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Aus Organisation entfernen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {user.name} verliert den Zugriff auf {org.name}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogClose render={<Button variant="ghost" />}>
                                    Abbrechen
                                  </AlertDialogClose>
                                  <Button
                                    loading={
                                      removeMembershipMutation.isPending &&
                                      removeMembershipMutation.variables === org.id
                                    }
                                    onClick={() => removeMembershipMutation.mutate(org.id)}
                                    variant="destructive"
                                  >
                                    Entfernen
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogPopup>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardFrame>

              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>Aktive Sitzungen</CardFrameTitle>
                  <CardFrameDescription>
                    Laufende Logins mit Gerät, IP und Ablaufzeit.
                  </CardFrameDescription>
                  <CardFrameAction>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            disabled={activeSessions.length === 0}
                            loading={revokeMutation.isPending}
                            size="sm"
                            variant="outline"
                          />
                        }
                      >
                        Alle widerrufen
                      </AlertDialogTrigger>
                      <AlertDialogPopup>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Alle Sitzungen widerrufen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {user.name} wird aus allen aktiven Sitzungen abgemeldet.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogClose render={<Button variant="ghost" />}>
                            Abbrechen
                          </AlertDialogClose>
                          <Button
                            loading={revokeMutation.isPending}
                            onClick={() => revokeMutation.mutate()}
                            variant="destructive"
                          >
                            Widerrufen
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogPopup>
                    </AlertDialog>
                  </CardFrameAction>
                </CardFrameHeader>
                <Table className="min-w-[680px]" variant="card">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gerät</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Aktualisiert</TableHead>
                      <TableHead className="text-right">Läuft ab</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.length === 0 ? (
                      <TableRow>
                        <TableCell className="py-8 text-center text-muted-foreground" colSpan={4}>
                          Keine aktiven Sitzungen.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {userAgentLabel(session.userAgent)}
                              </p>
                              {session.impersonatedBy ? (
                                <p className="text-muted-foreground text-xs">
                                  Impersoniert durch {session.impersonatedBy}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.ipAddress ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(session.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatDate(session.expiresAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardFrame>
            </div>

            <div className="flex flex-col gap-6">
              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>Sicherheit</CardFrameTitle>
                </CardFrameHeader>
                <Card>
                  <CardPanel className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg border bg-muted p-2">
                        {user.twoFactorEnabled ? (
                          <ShieldCheckIcon className="size-4 text-success-foreground" />
                        ) : (
                          <ShieldIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          2FA {user.twoFactorEnabled ? "aktiviert" : "nicht aktiviert"}
                        </p>
                        <p className="text-muted-foreground text-xs leading-5">
                          {user.twoFactorEnabled
                            ? "Der Account verlangt einen zweiten Faktor beim Login."
                            : "Dieser Account ist nur durch Passwort oder Provider geschützt."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg border bg-muted p-2">
                        <CheckCircle2Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          E-Mail {user.emailVerified ? "verifiziert" : "nicht verifiziert"}
                        </p>
                        <p className="text-muted-foreground text-xs leading-5">
                          {user.emailVerified
                            ? "Die Adresse wurde bestätigt."
                            : "Die Adresse wurde noch nicht bestätigt."}
                        </p>
                      </div>
                    </div>
                  </CardPanel>
                </Card>
              </CardFrame>

              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>Details</CardFrameTitle>
                </CardFrameHeader>
                <Card>
                  <CardPanel className="flex flex-col gap-4">
                    <InfoField label="User-ID" value={user.id} />
                    <InfoField label="Erstellt" value={formatDate(user.createdAt)} />
                    <InfoField label="Aktualisiert" value={formatDate(user.updatedAt)} />
                    {user.banned ? (
                      <InfoField label="Sperrgrund" value={user.banReason || "—"} />
                    ) : null}
                  </CardPanel>
                </Card>
              </CardFrame>

              <CardFrame className="border-destructive/30">
                <CardFrameHeader>
                  <CardFrameTitle>Gefahrenzone</CardFrameTitle>
                </CardFrameHeader>
                <Card>
                  <CardPanel className="flex flex-wrap gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            loading={roleMutation.isPending}
                            variant={user.role === "admin" ? "destructive-outline" : "outline"}
                          />
                        }
                      >
                        {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                      </AlertDialogTrigger>
                      <AlertDialogPopup>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {user.role === "admin"
                              ? "Adminrechte entziehen?"
                              : "Adminrechte vergeben?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {user.role === "admin"
                              ? `${user.name} verliert Zugriff auf das Admin-Panel.`
                              : `${user.name} erhält Zugriff auf das Admin-Panel.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogClose render={<Button variant="ghost" />}>
                            Abbrechen
                          </AlertDialogClose>
                          <Button
                            loading={roleMutation.isPending}
                            onClick={() =>
                              roleMutation.mutate(user.role === "admin" ? "user" : "admin")
                            }
                            variant={user.role === "admin" ? "destructive" : "default"}
                          >
                            Bestätigen
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogPopup>
                    </AlertDialog>

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
          </div>

          <BanUserDialog
            loading={banMutation.isPending}
            onConfirm={(reason) => banMutation.mutate(reason)}
            onOpenChange={setBanOpen}
            open={banOpen}
            userName={user.name}
          />
          <ResetPasswordDialog onOpenChange={setResetOpen} open={resetOpen} userId={userId} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Benutzer nicht gefunden.</p>
      )}
    </div>
  );
}
