"use client";

import { ORPCError } from "@orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export function SelfServiceRegistrationsPageClient() {
  const [activeTab, setActiveTab] = useState<SubmissionStatusTab>("submitted");

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SubmissionStatusTab }) =>
      client.selfRegistrations.updateSubmissionStatus({ id, status }),
    onSuccess: () => {
      toast.success("Status aktualisiert");
      refetchSubmitted();
      refetchCreated();
    },
    onError: (error) => {
      toast.error(error.message || "Status konnte nicht aktualisiert werden");
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
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-base">Registrierungs-Codes</h2>
                  <p className="text-muted-foreground text-sm">
                    Diese Codes werden fuer die öffentliche Self-Service Anmeldung verwendet.
                  </p>
                </div>
                <Badge variant="secondary">{isPendingConfigs ? "..." : registrations.length}</Badge>
              </div>

              {isPendingConfigs ? (
                <p className="text-muted-foreground text-sm">Codes werden geladen...</p>
              ) : registrations.length === 0 ? (
                <Empty className="border border-dashed py-10">
                  <EmptyHeader>
                    <EmptyTitle>Noch keine Registrierungs-Codes</EmptyTitle>
                    <EmptyDescription>
                      Erstelle einen neuen Self-Service Code ueber den Button oben.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Abrechnung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Erstellt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.billingCycle}</TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "secondary" : "outline"}>
                            {item.isActive ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </FramePanel>
          </Frame>

          <Frame>
            <FramePanel>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as SubmissionStatusTab)}
              >
                <TabsList>
                  <TabsTrigger value="submitted">
                    Awaiting review
                    <Badge className="ml-2" variant="secondary">
                      {submittedRegistrations.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="created">
                    Created
                    <Badge className="ml-2" variant="secondary">
                      {createdRegistrations.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="submitted" className="pt-4">
                  {activePending ? (
                    <p className="text-muted-foreground text-sm">Registrierungen werden geladen...</p>
                  ) : activeRows.length === 0 ? (
                    <Empty className="border border-dashed py-10">
                      <EmptyHeader>
                        <EmptyTitle>Keine offenen Registrierungen</EmptyTitle>
                        <EmptyDescription>
                          Neue Einsendungen erscheinen hier als "Awaiting review".
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Self-Service</TableHead>
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
                            <TableCell>{formatDate(row.submittedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: row.id,
                                    status: "created",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle2 data-icon="inline-start" />
                                Als erstellt markieren
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="created" className="pt-4">
                  {activePending ? (
                    <p className="text-muted-foreground text-sm">Registrierungen werden geladen...</p>
                  ) : activeRows.length === 0 ? (
                    <Empty className="border border-dashed py-10">
                      <EmptyHeader>
                        <EmptyTitle>Keine erstellten Mitglieder</EmptyTitle>
                        <EmptyDescription>
                          Als erstellt markierte Registrierungen erscheinen hier.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Self-Service</TableHead>
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
                            <TableCell>{formatDate(row.submittedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Created</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </FramePanel>
          </Frame>
        </>
      )}
    </div>
  );
}
