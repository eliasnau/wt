"use client";

import { ORPCError } from "@orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Copy, Eye, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Sheet,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client, orpc, queryClient } from "@/utils/orpc";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderDescription,
  HeaderTitle,
} from "../../_components/page-header";
import { CreateSelfServiceSheet } from "./_components/create-self-service-sheet";

type SubmissionStatusTab = "submitted" | "created";

type RegistrationRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  billingCycle: string;
  joiningFeeAmount: string | null;
  yearlyFeeAmount: string | null;
  contractStartDate: string | null;
  notes: string | null;
  isActive: boolean;
  status: string;
  groupsSnapshot: unknown;
  memberId?: string | null;
  createdAt: Date | string | null;
};

function formatInitialPeriod(value: string) {
  if (value === "monthly") return "Monatlich";
  if (value === "half_yearly") return "Halbjährlich";
  if (value === "yearly") return "Jährlich";
  return value;
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return `EUR ${parsed.toFixed(2)}`;
}

function normalizeGroups(value: unknown): Array<{
  groupId: string;
  groupNameSnapshot: string;
  schedule?: string;
  monthlyFee: string;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      if (
        typeof item.groupId !== "string" ||
        typeof item.groupNameSnapshot !== "string" ||
        typeof item.monthlyFee !== "string"
      ) {
        return null;
      }
      return {
        groupId: item.groupId,
        groupNameSnapshot: item.groupNameSnapshot,
        monthlyFee: item.monthlyFee,
        schedule: typeof item.schedule === "string" ? item.schedule : undefined,
      };
    })
    .filter(
      (row): row is { groupId: string; groupNameSnapshot: string; monthlyFee: string; schedule?: string } =>
        row !== null,
    );
}

export function SelfServiceRegistrationsPageClient() {
  const [activeTab, setActiveTab] = useState<SubmissionStatusTab>("submitted");
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistrationRow | null>(null);

  const {
    data: submittedRegistrations = [],
    isPending: isPendingSubmitted,
    error: submittedError,
    refetch: refetchSubmitted,
  } = useQuery(
    orpc.selfRegistrations.listSubmissions.queryOptions({
      input: { status: "submitted" },
    }),
  );

  const {
    data: createdRegistrations = [],
    isPending: isPendingCreated,
    error: createdError,
    refetch: refetchCreated,
  } = useQuery(
    orpc.selfRegistrations.listSubmissions.queryOptions({
      input: { status: "created" },
    }),
  );

  const {
    data: registrations = [],
    isPending: isPendingConfigs,
    error: configsError,
    refetch: refetchConfigs,
  } = useQuery(
    orpc.selfRegistrations.list.queryOptions({
      input: {},
    }),
  );

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: string) => client.selfRegistrations.delete({ id }),
    onSuccess: () => {
      toast.success("Registrierung gelöscht");
      setDeleteTarget(null);
      setSelectedRegistration(null);
      refetchConfigs();
      refetchSubmitted();
      refetchCreated();
    },
    onError: (error) => {
      toast.error(error.message || "Registrierung konnte nicht gelöscht werden");
    },
  });

  const activeRows = activeTab === "submitted" ? submittedRegistrations : createdRegistrations;
  const activeError = activeTab === "submitted" ? submittedError : createdError;
  const activePending = activeTab === "submitted" ? isPendingSubmitted : isPendingCreated;

  const isNoPermissionError = (() => {
    const error = activeError || configsError;
    if (!error) return false;

    if (error instanceof ORPCError && error.code === "FORBIDDEN") {
      return true;
    }

    return false;
  })();

  const handleRefreshAll = async () => {
    await Promise.all([refetchSubmitted(), refetchCreated(), refetchConfigs()]);
    queryClient.invalidateQueries();
  };

  return (
    <div className="flex flex-col gap-8">
      <Header>
        <HeaderContent>
          <HeaderTitle>Self-Service Registrierungen</HeaderTitle>
          <HeaderDescription>
            Verwalte Registrierungs-Codes und eingegangene Self-Service Anmeldungen.
          </HeaderDescription>
        </HeaderContent>
        <HeaderActions>
          <CreateSelfServiceSheet onCreated={refetchConfigs} />
        </HeaderActions>
      </Header>

      {activeError || configsError ? (
        <Frame>
          <FramePanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle />
                </EmptyMedia>
                <EmptyTitle>
                  {isNoPermissionError
                    ? "Kein Zugriff auf Self-Service"
                    : "Self-Service Daten konnten nicht geladen werden"}
                </EmptyTitle>
                <EmptyDescription>
                  {isNoPermissionError
                    ? "Du hast nicht die nötigen Berechtigungen, um Self-Service-Registrierungen zu verwalten."
                    : activeError instanceof Error
                      ? activeError.message
                      : configsError instanceof Error
                        ? configsError.message
                        : "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleRefreshAll}>Erneut versuchen</Button>
              </EmptyContent>
            </Empty>
          </FramePanel>
        </Frame>
      ) : (
        <>
          <Frame>
            <FramePanel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-base">Registrierungs-Codes</h2>
                  <p className="text-muted-foreground text-sm">
                    Ein Code entspricht genau einer Selbstregistrierung.
                  </p>
                </div>
                <Badge variant="secondary">{isPendingConfigs ? "..." : registrations.length}</Badge>
              </div>

              {isPendingConfigs ? (
                <p className="text-muted-foreground text-sm">Codes werden geladen...</p>
              ) : registrations.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyTitle>Noch keine Registrierungs-Codes</EmptyTitle>
                    <EmptyDescription>
                      Erstelle einen neuen Self-Service Code über den Button oben.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Laufzeit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mitglied</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(registrations as RegistrationRow[]).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{formatInitialPeriod(item.billingCycle)}</TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "secondary" : "outline"}>
                            {item.status === "draft"
                              ? "Offen"
                              : item.status === "submitted"
                                ? "Eingereicht"
                                : item.status === "created"
                                  ? "Erstellt"
                                  : item.isActive
                                    ? "Aktiv"
                                    : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.memberId || "-"}</TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRegistration(item)}
                            >
                              <Eye data-icon="inline-start" />
                              Ansehen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await navigator.clipboard.writeText(item.code);
                                toast.success("Code kopiert");
                              }}
                            >
                              <Copy data-icon="inline-start" />
                              Kopieren
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Löschen
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </FramePanel>
          </Frame>

          <Frame>
            <FramePanel>
              <div className="mb-4">
                <h2 className="font-semibold text-base">Eingegangene Registrierungen</h2>
                <p className="text-muted-foreground text-sm">
                  Prüfe Einsendungen, bearbeite Daten und erstelle danach das Mitglied.
                </p>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant={activeTab === "submitted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("submitted")}
                >
                  Awaiting Review
                  <Badge className="ml-2" variant="secondary">
                    {submittedRegistrations.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "created" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("created")}
                >
                  Created
                  <Badge className="ml-2" variant="secondary">
                    {createdRegistrations.length}
                  </Badge>
                </Button>
              </div>

              {activePending ? (
                <p className="text-muted-foreground text-sm">Registrierungen werden geladen...</p>
              ) : activeRows.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyTitle>
                      {activeTab === "submitted"
                        ? "Keine offenen Registrierungen"
                        : "Keine erstellten Mitglieder"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {activeTab === "submitted"
                        ? 'Neue Einsendungen erscheinen hier als "Awaiting review".'
                        : "Als erstellt markierte Registrierungen erscheinen hier."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : activeTab === "submitted" ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Self-Service</TableHead>
                      <TableHead>Mitglied</TableHead>
                      <TableHead>Eingang</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.firstName} {row.lastName}
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.configName || "-"}</TableCell>
                        <TableCell>{row.memberId || "-"}</TableCell>
                        <TableCell>{formatDate(row.submittedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            render={
                              <Link
                                href={
                                  `/dashboard/self-service/registrations/${row.id}` as Route
                                }
                              />
                            }
                          >
                            <CheckCircle2 data-icon="inline-start" />
                            Prüfen
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Self-Service</TableHead>
                      <TableHead>Mitglied</TableHead>
                      <TableHead>Eingang</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.firstName} {row.lastName}
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.configName || "-"}</TableCell>
                        <TableCell>{row.memberId || "-"}</TableCell>
                        <TableCell>{formatDate(row.submittedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">Created</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </FramePanel>
          </Frame>

          <Sheet
            open={Boolean(selectedRegistration)}
            onOpenChange={(open) => {
              if (!open) setSelectedRegistration(null);
            }}
          >
            <SheetPopup inset>
              <SheetHeader>
                <SheetTitle>Registrierungs-Code ansehen</SheetTitle>
              </SheetHeader>
              <SheetPanel className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium text-sm">{selectedRegistration?.name || "-"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Code</p>
                    <p className="font-medium text-sm">{selectedRegistration?.code || "-"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Laufzeit</p>
                    <p className="font-medium text-sm">
                      {selectedRegistration
                        ? formatInitialPeriod(selectedRegistration.billingCycle)
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Vertragsbeginn</p>
                    <p className="font-medium text-sm">
                      {selectedRegistration?.contractStartDate || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Aufnahmegebühr</p>
                    <p className="font-medium text-sm">
                      {formatMoney(selectedRegistration?.joiningFeeAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Jahresbeitrag</p>
                    <p className="font-medium text-sm">
                      {formatMoney(selectedRegistration?.yearlyFeeAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Gruppen</h3>
                  {normalizeGroups(selectedRegistration?.groupsSnapshot).length === 0 ? (
                    <p className="text-muted-foreground text-sm">Keine Gruppen hinterlegt.</p>
                  ) : (
                    <div className="space-y-2">
                      {normalizeGroups(selectedRegistration?.groupsSnapshot).map((group) => (
                        <div key={group.groupId} className="rounded-lg border p-3">
                          <p className="font-medium text-sm">{group.groupNameSnapshot}</p>
                          <p className="text-muted-foreground text-xs">{group.schedule || "-"}</p>
                          <p className="text-xs">Monatsbeitrag: {formatMoney(group.monthlyFee)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SheetPanel>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!selectedRegistration) return;
                    await navigator.clipboard.writeText(selectedRegistration.code);
                    toast.success("Code kopiert");
                  }}
                >
                  <Copy data-icon="inline-start" />
                  Code kopieren
                </Button>
                <Button onClick={() => setSelectedRegistration(null)}>Schliessen</Button>
              </SheetFooter>
            </SheetPopup>
          </Sheet>

          <AlertDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
          >
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Registrierungs-Code löschen</AlertDialogTitle>
                <AlertDialogDescription>
                  "{deleteTarget?.name}" mit Code "{deleteTarget?.code}" wird dauerhaft gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={<Button variant="outline" />}
                  disabled={deleteRegistrationMutation.isPending}
                >
                  Abbrechen
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  disabled={deleteRegistrationMutation.isPending || !deleteTarget}
                  onClick={() => {
                    if (!deleteTarget) return;
                    deleteRegistrationMutation.mutate(deleteTarget.id);
                  }}
                >
                  {deleteRegistrationMutation.isPending ? "Wird gelöscht..." : "Löschen"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
