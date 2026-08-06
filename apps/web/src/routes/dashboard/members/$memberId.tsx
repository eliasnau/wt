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
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@matdesk/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@matdesk/ui/components/dialog";
import { Input } from "@matdesk/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
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
import { Map, MapControls, MapMarker, MarkerContent } from "@matdesk/ui/components/ui/map";
import { cn } from "@matdesk/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { ArrowLeftIcon, MapPinIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { AssignGroupDialog } from "@/components/dashboard/members/assign-group-dialog";
import { MemberContractSheet } from "@/components/dashboard/members/member-contract-sheet";
import { MemberCreditsCard } from "@/components/dashboard/members/member-credits-card";
import { MemberDetailsSheet } from "@/components/dashboard/members/member-details-sheet";
import { MemberProgressionCard } from "@/components/dashboard/members/member-progression-card";
import { UserAvatar } from "@/components/auth/user-avatar";
import { formatCents, formatDate } from "@/lib/format";
import { client, orpc, queryClient } from "@/utils/orpc";

type Member = Awaited<ReturnType<typeof client.members.get>>;

export const Route = createFileRoute("/dashboard/members/$memberId")({
  component: RouteComponent,
});

type MemberStatus = "active" | "cancelled_but_active" | "cancelled";

const STATUS_META: Record<
  MemberStatus,
  { label: string; variant: "success" | "warning" | "secondary"; dot: string }
> = {
  active: { label: "Aktiv", variant: "success", dot: "bg-emerald-500" },
  cancelled_but_active: { label: "Gekündigt", variant: "warning", dot: "bg-amber-500" },
  cancelled: { label: "Beendet", variant: "secondary", dot: "bg-muted-foreground" },
};

const INITIAL_PERIOD_LABELS: Record<string, string> = {
  monthly: "Monatlich",
  half_yearly: "Halbjährlich",
  yearly: "Jährlich",
};

const YEARLY_FEE_MODE_LABELS: Record<string, string> = {
  january: "Im Januar",
  anniversary: "Zum Jahrestag",
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Earliest valid cancellation date: the first month-end strictly after today
 *  that isn't before the initial period ends. */
function firstCancellationDate(today: string, initialPeriodEndDate: string | null) {
  const floor = initialPeriodEndDate && initialPeriodEndDate > today ? initialPeriodEndDate : today;
  let year = Number(floor.slice(0, 4));
  let month = Number(floor.slice(5, 7)); // 1-indexed
  for (let i = 0; i < 36; i++) {
    const monthEnd = toYmd(new Date(year, month, 0)); // last day of 1-indexed month
    if (monthEnd > today && (!initialPeriodEndDate || monthEnd >= initialPeriodEndDate)) {
      return monthEnd;
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return floor;
}

function memberStatus(
  contract: {
    cancelledAt: Date | string | null;
    cancellationEffectiveDate: string | null;
  } | null,
): MemberStatus {
  if (!contract?.cancelledAt) return "active";
  const effective = contract.cancellationEffectiveDate;
  if (!effective || effective >= todayYmd()) return "cancelled_but_active";
  return "cancelled";
}

function age(birthdate: string | null) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--;
  return years;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function RouteComponent() {
  const { memberId } = Route.useParams();
  const memberQuery = useQuery(orpc.members.get.queryOptions({ input: { memberId } }));

  return (
    <div className="flex flex-col gap-6">
      <Button
        className="-ml-2 self-start text-muted-foreground"
        render={<Link to="/dashboard/members" />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon />
        Zurück zu Mitgliedern
      </Button>

      {memberQuery.isPending ? (
        <HeaderSkeleton />
      ) : memberQuery.isError ? (
        <CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-muted-foreground text-sm">{parseError(memberQuery.error).message}</p>
          <Button onClick={() => memberQuery.refetch()} size="sm" variant="outline">
            Erneut versuchen
          </Button>
        </CardFrame>
      ) : (
        <MemberDetail member={memberQuery.data} />
      )}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-14 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function invalidateMember(memberId: string) {
  queryClient.invalidateQueries({
    queryKey: orpc.members.get.key({ input: { memberId } }),
  });
  queryClient.invalidateQueries({ queryKey: orpc.members.query.key() });
}

function MemberDetail({ member }: { member: Member }) {
  const contract = member.contracts[0] ?? null;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelEffectiveDate, setCancelEffectiveDate] = useState(() =>
    firstCancellationDate(todayYmd(), contract?.initialPeriodEndDate ?? null),
  );
  const [removing, setRemoving] = useState<{ groupId: string; name: string } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const status = STATUS_META[memberStatus(contract)];
  const memberAge = age(member.birthdate);
  const isCancelled = Boolean(contract?.cancelledAt);

  const cancelMutation = useMutation(
    orpc.members.cancelContract.mutationOptions({
      onSuccess: () => {
        toast.success("Mitgliedschaft gekündigt");
        invalidateMember(member.id);
        setCancelOpen(false);
        setCancelReason("");
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const updatePriceMutation = useMutation(
    orpc.members.updateGroupMembership.mutationOptions({
      onSuccess: () => {
        toast.success("Beitrag aktualisiert");
        invalidateMember(member.id);
        setPriceDrafts({});
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const removeMutation = useMutation(
    orpc.members.removeGroupMembership.mutationOptions({
      onSuccess: () => {
        toast.success("Aus Gruppe entfernt");
        invalidateMember(member.id);
        setRemoving(null);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  function savePrice(groupId: string, currentCents: number) {
    const draft = priceDrafts[groupId];
    if (draft === undefined) return;
    const cents = Math.max(0, Math.round(Number(draft) * 100));
    if (!Number.isFinite(cents) || cents === currentCents) {
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      return;
    }
    updatePriceMutation.mutate({ memberId: member.id, groupId, membershipPriceCents: cents });
  }

  const assignedGroupIds = member.groupMembers.map((m) => m.groupId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar
            className="size-14"
            name={`${member.firstName} ${member.lastName}`}
            seed={member.id}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-semibold text-2xl tracking-tight">
                {member.firstName} {member.lastName}
              </h1>
              <Badge variant={status.variant}>
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-muted-foreground text-sm">
              {member.email || "Keine E-Mail"}
              {memberAge != null ? ` · ${memberAge} Jahre` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDetailsOpen(true)} variant="outline">
            Daten bearbeiten
          </Button>
          {!isCancelled ? (
            <Button onClick={() => setCancelOpen(true)} variant="destructive-outline">
              Kündigen
            </Button>
          ) : null}
        </div>
      </div>

      {/* 1) Personal & contact — most important */}
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Persönliche Daten</CardFrameTitle>
          <CardFrameDescription>Kontaktangaben und Anschrift.</CardFrameDescription>
          <CardFrameAction>
            <Button onClick={() => setDetailsOpen(true)} size="sm" variant="outline">
              Bearbeiten
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Vorname" value={member.firstName} />
              <Detail label="Nachname" value={member.lastName} />
              <Detail label="Geburtsdatum" value={formatDate(member.birthdate)} />
              <Detail label="E-Mail" value={member.email || "—"} />
              <Detail label="Telefon" value={member.phone || "—"} />
              <Detail
                label="Adresse"
                value={
                  <div className="flex items-start gap-2">
                    <span className="text-pretty">
                      {member.street}
                      <br />
                      {member.postalCode} {member.city}
                      <br />
                      {member.state}, {member.country}
                    </span>
                    <Button
                      aria-label="Adresse auf Karte anzeigen"
                      disabled={member.latitude == null || member.longitude == null}
                      onClick={() => setMapOpen(true)}
                      size="icon-sm"
                      variant="outline"
                    >
                      <MapPinIcon />
                    </Button>
                  </div>
                }
              />
            </dl>
          </CardPanel>
        </Card>
      </CardFrame>

      {/* 2) Groups */}
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Gruppen</CardFrameTitle>
          <CardFrameDescription>
            {member.groupMembers.length} aktive Mitgliedschaften.
          </CardFrameDescription>
          <CardFrameAction>
            <Button onClick={() => setAssignOpen(true)} size="sm" variant="outline">
              <PlusIcon />
              Gruppe zuweisen
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Table className="min-w-[480px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Gruppe</TableHead>
              <TableHead className="w-48">Monatsbeitrag</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {member.groupMembers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-8 text-center text-muted-foreground" colSpan={3}>
                  Keine Gruppen zugewiesen.
                </TableCell>
              </TableRow>
            ) : (
              member.groupMembers.map((membership) => {
                const draft = priceDrafts[membership.groupId];
                const value = draft ?? String(membership.membershipPriceCents / 100);
                return (
                  <TableRow key={membership.groupId}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: membership.group.color }}
                        />
                        <span className="font-medium text-foreground">{membership.group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-48">
                      <InputGroup className="w-32">
                        <InputGroupAddon>€</InputGroupAddon>
                        <InputGroupInput
                          min="0"
                          onBlur={() =>
                            savePrice(membership.groupId, membership.membershipPriceCents)
                          }
                          onChange={(e) =>
                            setPriceDrafts((prev) => ({
                              ...prev,
                              [membership.groupId]: e.target.value,
                            }))
                          }
                          step="0.01"
                          type="number"
                          value={value}
                        />
                      </InputGroup>
                    </TableCell>
                    <TableCell className="w-px">
                      <Button
                        aria-label="Aus Gruppe entfernen"
                        onClick={() =>
                          setRemoving({
                            groupId: membership.groupId,
                            name: membership.group.name,
                          })
                        }
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardFrame>

      <MemberProgressionCard memberId={member.id} />

      {/* 3) Contract */}
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Vertrag</CardFrameTitle>
          <CardFrameDescription>Laufzeit und Beiträge der Mitgliedschaft.</CardFrameDescription>
          {contract ? (
            <CardFrameAction>
              <Button onClick={() => setContractOpen(true)} size="sm" variant="outline">
                Beiträge bearbeiten
              </Button>
            </CardFrameAction>
          ) : null}
        </CardFrameHeader>
        <Card>
          <CardPanel>
            {contract ? (
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Detail
                  label="Erstlaufzeit"
                  value={INITIAL_PERIOD_LABELS[contract.initialPeriod] ?? contract.initialPeriod}
                />
                <Detail label="Beginn" value={formatDate(contract.startDate)} />
                <Detail
                  label="Erstlaufzeit-Ende"
                  value={formatDate(contract.initialPeriodEndDate)}
                />
                <Detail label="Aufnahmegebühr" value={formatCents(contract.joiningFeeCents)} />
                <Detail label="Jahresbeitrag" value={formatCents(contract.yearlyFeeCents)} />
                <Detail
                  label="Jahresbeitrag-Modus"
                  value={YEARLY_FEE_MODE_LABELS[contract.yearlyFeeMode] ?? contract.yearlyFeeMode}
                />
                {contract.cancelledAt ? (
                  <>
                    <Detail label="Gekündigt am" value={formatDate(contract.cancelledAt)} />
                    <Detail
                      label="Wirksam zum"
                      value={formatDate(contract.cancellationEffectiveDate)}
                    />
                    <Detail label="Grund" value={contract.cancellationReason || "—"} />
                  </>
                ) : null}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">Kein Vertrag vorhanden.</p>
            )}
          </CardPanel>
        </Card>
      </CardFrame>

      {/* 4) Credits — contract-scoped, so only meaningful once a contract exists */}
      {contract ? (
        <MemberCreditsCard
          contractId={contract.id}
          memberId={member.id}
          memberName={`${member.firstName} ${member.lastName}`}
        />
      ) : null}

      {/* 5) Payment + guardian */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>SEPA-Lastschrift</CardFrameTitle>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <dl className="grid gap-5 sm:grid-cols-3">
                <Detail label="Kontoinhaber" value={member.cardHolder} />
                <Detail
                  label="IBAN"
                  value={<span className="break-all font-mono">{member.iban}</span>}
                />
                <Detail
                  label="BIC"
                  value={<span className="break-all font-mono">{member.bic}</span>}
                />
              </dl>
            </CardPanel>
          </Card>
        </CardFrame>

        {member.guardianName || member.guardianEmail || member.guardianPhone ? (
          <CardFrame>
            <CardFrameHeader>
              <CardFrameTitle>Erziehungsberechtigte/r</CardFrameTitle>
            </CardFrameHeader>
            <Card>
              <CardPanel>
                <dl className="grid gap-5 sm:grid-cols-3">
                  <Detail label="Name" value={member.guardianName || "—"} />
                  <Detail label="E-Mail" value={member.guardianEmail || "—"} />
                  <Detail label="Telefon" value={member.guardianPhone || "—"} />
                </dl>
              </CardPanel>
            </Card>
          </CardFrame>
        ) : null}
      </div>

      {member.notes ? (
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>Notiz</CardFrameTitle>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <p className="whitespace-pre-wrap text-foreground text-sm">{member.notes}</p>
            </CardPanel>
          </Card>
        </CardFrame>
      ) : null}

      {/* Edit surfaces */}
      <MemberDetailsSheet member={member} onOpenChange={setDetailsOpen} open={detailsOpen} />
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogPopup className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {member.firstName} {member.lastName}
            </DialogTitle>
            <DialogDescription>
              {member.street}, {member.postalCode} {member.city}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="p-0">
            {member.latitude != null && member.longitude != null ? (
              <Map
                center={[member.longitude, member.latitude]}
                className="h-[26rem] w-full"
                zoom={15}
              >
                <MapControls position="bottom-right" showZoom />
                <MapMarker latitude={member.latitude} longitude={member.longitude}>
                  <MarkerContent>
                    <div className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md">
                      <MapPinIcon className="size-4" />
                    </div>
                  </MarkerContent>
                </MapMarker>
              </Map>
            ) : null}
          </DialogPanel>
        </DialogPopup>
      </Dialog>
      {contract ? (
        <MemberContractSheet
          member={{
            id: member.id,
            joiningFeeCents: contract.joiningFeeCents,
            yearlyFeeCents: contract.yearlyFeeCents,
          }}
          onOpenChange={setContractOpen}
          open={contractOpen}
        />
      ) : null}
      <AssignGroupDialog
        assignedGroupIds={assignedGroupIds}
        memberId={member.id}
        onOpenChange={setAssignOpen}
        open={assignOpen}
      />

      {/* Remove from group */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        open={Boolean(removing)}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Aus Gruppe entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Mitglied wird aus „{removing?.name}" entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              loading={removeMutation.isPending}
              onClick={() =>
                removing &&
                removeMutation.mutate({ memberId: member.id, groupId: removing.groupId })
              }
              variant="destructive"
            >
              Entfernen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      {/* Cancel membership */}
      <AlertDialog
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelReason("");
        }}
        open={cancelOpen}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitgliedschaft kündigen?</AlertDialogTitle>
            <AlertDialogDescription>
              Gib einen Grund an. Die Kündigung wird zum vertraglich nächstmöglichen Zeitpunkt
              wirksam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Wirksam zum</FieldLabel>
              <Input
                onChange={(e) => setCancelEffectiveDate(e.target.value)}
                type="date"
                value={cancelEffectiveDate}
              />
              <FieldDescription>Muss der letzte Tag eines Monats sein.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Kündigungsgrund</FieldLabel>
              <Textarea
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="z. B. Umzug, Vereinswechsel…"
                rows={3}
                value={cancelReason}
              />
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              disabled={cancelReason.trim() === "" || cancelEffectiveDate === ""}
              loading={cancelMutation.isPending}
              onClick={() =>
                cancelMutation.mutate({
                  memberId: member.id,
                  cancelReason: cancelReason.trim(),
                  cancellationEffectiveDate: cancelEffectiveDate,
                })
              }
              variant="destructive"
            >
              Kündigen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
