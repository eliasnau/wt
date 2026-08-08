import {
  type RoleName,
  assignableRoles,
  getRoleLabel,
  roleCanManageTeam,
  roleHas,
  roleMetadata,
} from "@matdesk/auth/permissions";
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
import { CardFrame } from "@matdesk/ui/components/card";
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
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
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
import { Tabs, TabsList, TabsTab } from "@matdesk/ui/components/tabs";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { MailIcon, PlusIcon, ShieldCheckIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-context";
import { UserAvatar } from "@/components/auth/user-avatar";
import { RolePermissions } from "@/components/dashboard/settings/role-permissions";
import { formatDate } from "@/lib/format";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/team")({
  component: RouteComponent,
});

type TeamTab = "members" | "invitations" | "permissions";

/** Roles offered when inviting or re-roling — ownership transfer is not one of them. */
const ROLE_OPTIONS = assignableRoles.map((role) => ({
  value: role,
  label: roleMetadata[role].label,
  description: roleMetadata[role].description,
}));

const DEFAULT_INVITE_ROLE: RoleName = "trainer";

const ROLE_ORDER = Object.keys(roleMetadata);

function roleRank(role: string) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

function RouteComponent() {
  const { activeOrganization, user, refetch } = useAuth();
  const [tab, setTab] = useState<TeamTab>("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<{ memberId: string; name: string } | null>(null);

  const members = [...(activeOrganization?.members ?? [])].sort(
    (a, b) => roleRank(a.role) - roleRank(b.role) || a.user.name.localeCompare(b.user.name, "de"),
  );
  const myRole = members.find((m) => m.userId === user?.id)?.role ?? null;
  const canManageTeam = roleCanManageTeam(myRole);
  const canInvite = roleHas(myRole, "invitation", "create");
  const canCancelInvite = roleHas(myRole, "invitation", "cancel");
  const canRemove = roleHas(myRole, "member", "delete");
  const invitations = (activeOrganization?.invitations ?? []).filter((i) => i.status === "pending");

  const roleMutation = useMutation({
    mutationFn: async (vars: { memberId: string; role: RoleName }) => {
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

  const pendingRoleMemberId = roleMutation.isPending ? roleMutation.variables.memberId : null;
  const cancellingInvitationId = cancelMutation.isPending ? cancelMutation.variables : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Team</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Wer Zugriff auf diese Organisation hat und was die Rollen dürfen.
          </p>
        </div>
        {canInvite ? (
          <Button onClick={() => setInviteOpen(true)}>
            <PlusIcon />
            Einladen
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto border-b">
        <Tabs onValueChange={(value) => setTab(String(value) as TeamTab)} value={tab}>
          <TabsList variant="underline">
            <TabsTab value="members">
              <UsersIcon /> Mitglieder
              <TabCount>{members.length}</TabCount>
            </TabsTab>
            <TabsTab value="invitations">
              <MailIcon /> Einladungen
              {invitations.length > 0 ? <TabCount>{invitations.length}</TabCount> : null}
            </TabsTab>
            <TabsTab value="permissions">
              <ShieldCheckIcon /> Berechtigungen
            </TabsTab>
          </TabsList>
        </Tabs>
      </div>

      {tab === "members" ? (
        <CardFrame className="min-w-0 overflow-hidden">
          <Table className="min-w-[600px]" variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Mitglied</TableHead>
                <TableHead className="w-52">Rolle</TableHead>
                <TableHead>Beigetreten</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.userId === user?.id;
                const isOwner = member.role === "owner";
                const editable = canManageTeam && !isSelf && !isOwner;
                // The current role must be in `items` for the trigger to label it —
                // owner and the legacy role are not assignable but still shown.
                const options = ROLE_OPTIONS.some((option) => option.value === member.role)
                  ? ROLE_OPTIONS
                  : [
                      ...ROLE_OPTIONS,
                      {
                        value: member.role,
                        label: getRoleLabel(member.role),
                        description: roleMetadata[member.role as RoleName]?.description ?? "",
                      },
                    ];
                const disabledReason = isSelf
                  ? "Du kannst deine eigene Rolle nicht ändern."
                  : isOwner
                    ? "Die Rolle des Inhabers kann hier nicht geändert werden."
                    : "Du darfst Rollen nicht ändern.";
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
                      <Select
                        disabled={!editable || pendingRoleMemberId === member.id}
                        items={options}
                        onValueChange={(value) => {
                          if (!value || value === member.role) return;
                          roleMutation.mutate({
                            memberId: member.id,
                            role: value as RoleName,
                          });
                        }}
                        value={member.role}
                      >
                        <SelectTrigger
                          className="w-48"
                          size="sm"
                          title={editable ? undefined : disabledReason}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup alignItemWithTrigger={false} className="w-72">
                          {options.map((option) => (
                            <SelectItem
                              className="items-start py-2"
                              key={option.value}
                              value={option.value}
                            >
                              <span className="block truncate font-medium">{option.label}</span>
                              {option.description ? (
                                <span className="mt-0.5 block text-pretty text-muted-foreground text-xs">
                                  {option.description}
                                </span>
                              ) : null}
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.createdAt)}
                    </TableCell>
                    <TableCell className="w-px">
                      <div className="flex justify-end">
                        {canRemove && !isSelf && !isOwner ? (
                          <Button
                            aria-label={`${member.user.name} entfernen`}
                            className="text-muted-foreground hover:text-destructive-foreground"
                            onClick={() =>
                              setRemoving({ memberId: member.id, name: member.user.name })
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Trash2Icon />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardFrame>
      ) : null}

      {tab === "invitations" ? (
        <CardFrame className="min-w-0 overflow-hidden">
          <Table className="min-w-[520px]" variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead className="w-52">Rolle</TableHead>
                <TableHead>Läuft ab</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-10 text-center" colSpan={4}>
                    <p className="font-medium text-foreground text-sm">Keine offenen Einladungen</p>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Lade Trainer, Empfang oder Buchhaltung per E-Mail ins Team ein.
                    </p>
                    {canInvite ? (
                      <Button
                        className="mt-3"
                        onClick={() => setInviteOpen(true)}
                        size="sm"
                        variant="outline"
                      >
                        <PlusIcon />
                        Einladen
                      </Button>
                    ) : null}
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
                    <TableCell>
                      <Badge variant="secondary">{getRoleLabel(invitation.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invitation.expiresAt)}
                    </TableCell>
                    <TableCell className="w-px">
                      <div className="flex justify-end">
                        {canCancelInvite ? (
                          <Button
                            loading={cancellingInvitationId === invitation.id}
                            onClick={() => cancelMutation.mutate(invitation.id)}
                            size="sm"
                            variant="ghost"
                          >
                            Zurückziehen
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardFrame>
      ) : null}

      {tab === "permissions" ? <RolePermissions /> : null}

      <InviteDialog
        onOpenChange={setInviteOpen}
        onSuccess={async () => {
          await refetch();
          setTab("invitations");
        }}
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

function TabCount({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 font-normal text-muted-foreground text-xs tabular-nums">
      {children}
    </span>
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
  const [role, setRole] = useState<RoleName>(DEFAULT_INVITE_ROLE);

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
      setRole(DEFAULT_INVITE_ROLE);
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
                items={ROLE_OPTIONS}
                onValueChange={(value) => value && setRole(value as RoleName)}
                value={role}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  {ROLE_OPTIONS.map((item) => (
                    <SelectItem className="items-start py-2" key={item.value} value={item.value}>
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-0.5 block text-pretty text-muted-foreground text-xs">
                        {item.description}
                      </span>
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FieldDescription>{roleMetadata[role].description}</FieldDescription>
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
