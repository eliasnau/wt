"use client";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@matdesk/ui/components/alert";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Input } from "@matdesk/ui/components/input";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  AlertTriangleIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileDownIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/finance/")({
  component: FinancePage,
});

function ymd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultCollectionDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return ymd(date);
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { currency: "EUR", style: "currency" });
}

function formatDate(value: string | Date) {
  return new Date(`${typeof value === "string" ? value : ymd(value)}T00:00:00`).toLocaleDateString(
    "de-DE",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );
}

function downloadXml(xml: string, batchNumber: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${batchNumber}.xml`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function FinancePage() {
  const [collectionDate, setCollectionDate] = useState(defaultCollectionDate);
  const [lastRun, setLastRun] = useState<{
    batchNumber: string;
    createdInvoiceCount: number;
    excludedCount: number;
    totalAmountCents: number;
    transactionCount: number;
  } | null>(null);
  const batchesQuery = useQuery(orpc.billing.listSepaBatches.queryOptions({ input: {} }));
  const settingsQuery = useQuery(orpc.billing.getSepaSettings.queryOptions({ input: {} }));

  const prepareMutation = useMutation(
    orpc.billing.prepareSepaCollection.mutationOptions({
      onSuccess: (result) => {
        downloadXml(result.xml, result.batch.batchNumber);
        setLastRun({
          batchNumber: result.batch.batchNumber,
          createdInvoiceCount: result.createdInvoiceCount,
          excludedCount: result.excludedInvoices.length,
          totalAmountCents: result.batch.totalAmountCents,
          transactionCount: result.batch.transactionCount,
        });
        toast.success(`${result.batch.transactionCount} Lastschriften als SEPA-Datei erstellt`);
        queryClient.invalidateQueries({ queryKey: orpc.billing.listSepaBatches.key() });
        queryClient.invalidateQueries({ queryKey: orpc.billing.listInvoices.key() });
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const downloadMutation = useMutation(
    orpc.billing.downloadSepaBatch.mutationOptions({
      onSuccess: (result) => downloadXml(result.xml, result.batch.batchNumber),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const settings = settingsQuery.data;
  const settingsComplete = Boolean(
    settings?.creditorName && settings.creditorIban && settings.creditorBic && settings.creditorId,
  );
  const batches = batchesQuery.data ?? [];

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!collectionDate) return;
    prepareMutation.mutate({ collectionDate });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Finanzen</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Mitgliedsbeiträge abrechnen und als SEPA-Lastschrift einreichen.
          </p>
        </div>
        <Button render={<Link to="/dashboard/finance/invoices" />} variant="outline">
          <ReceiptTextIcon />
          Rechnungen ansehen
        </Button>
      </div>

      {!settingsQuery.isPending && !settingsComplete ? (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertTitle>SEPA-Einstellungen vervollständigen</AlertTitle>
          <AlertDescription>
            Für den Export werden Gläubigername, IBAN, BIC und Gläubiger-ID benötigt.
          </AlertDescription>
          <AlertAction>
            <Button render={<Link to="/dashboard/settings/sepa" />} size="sm" variant="outline">
              Einstellungen öffnen
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>SEPA-Einzug vorbereiten</CardFrameTitle>
          <CardFrameDescription>
            Fehlende Rechnungen erzeugen, offene Lastschriften bündeln und XML herunterladen.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <form className="flex flex-col gap-5 sm:flex-row sm:items-end" onSubmit={submit}>
              <Field className="w-full sm:max-w-xs">
                <FieldLabel htmlFor="collection-date">Einzugsdatum</FieldLabel>
                <Input
                  id="collection-date"
                  onChange={(event) => setCollectionDate(event.target.value)}
                  required
                  type="date"
                  value={collectionDate}
                />
                <FieldDescription>
                  Fehlende Rechnungen werden automatisch bis zu diesem Monat erstellt.
                </FieldDescription>
              </Field>
              <Button
                disabled={!collectionDate || !settingsComplete}
                loading={prepareMutation.isPending}
                size="lg"
                type="submit"
              >
                <FileDownIcon data-icon="inline-start" />
                Rechnungen erzeugen &amp; XML laden
              </Button>
            </form>
          </CardPanel>
        </Card>
      </CardFrame>

      {lastRun ? (
        <Alert variant={lastRun.excludedCount > 0 ? "warning" : "success"}>
          {lastRun.excludedCount > 0 ? <AlertTriangleIcon /> : <CircleCheckIcon />}
          <AlertTitle>SEPA-Datei {lastRun.batchNumber} wurde erstellt</AlertTitle>
          <AlertDescription>
            {lastRun.createdInvoiceCount} Rechnungen neu erzeugt, {lastRun.transactionCount}{" "}
            Lastschriften über {formatCurrency(lastRun.totalAmountCents)} exportiert.
            {lastRun.excludedCount > 0
              ? ` ${lastRun.excludedCount} Rechnungen wurden ausgeschlossen, zum Beispiel wegen eines fehlenden Mandats.`
              : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Letzte Einzüge</CardFrameTitle>
          <CardFrameDescription>Bereits erzeugte SEPA-Sammellastschriften.</CardFrameDescription>
          <CardFrameAction>
            <Button render={<Link to="/dashboard/finance/invoices" />} size="sm" variant="outline">
              Rechnungen
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        {batchesQuery.isPending ? (
          <Card>
            <CardPanel className="flex flex-col gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardPanel>
          </Card>
        ) : batches.length === 0 ? (
          <Card>
            <CardPanel>
              <Empty className="py-10 md:py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ReceiptTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>Noch keine Einzüge</EmptyTitle>
                  <EmptyDescription>
                    Der erste erzeugte SEPA-Einzug erscheint anschließend hier.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardPanel>
          </Card>
        ) : (
          <Table className="min-w-[680px]" variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Einzugsdatum</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Posten</TableHead>
                <TableHead className="text-right">Summe</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{formatDate(batch.collectionDate)}</TableCell>
                  <TableCell className="font-mono text-xs">{batch.batchNumber}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "downloaded" ? "success" : "secondary"}>
                      {batch.status === "downloaded" ? "Heruntergeladen" : batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {batch.transactionCount}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(batch.totalAmountCents)}
                  </TableCell>
                  <TableCell>
                    <Button
                      aria-label={`SEPA-Datei ${batch.batchNumber} herunterladen`}
                      disabled={downloadMutation.isPending}
                      onClick={() => downloadMutation.mutate({ id: batch.id })}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <DownloadIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardFrame>
    </div>
  );
}
