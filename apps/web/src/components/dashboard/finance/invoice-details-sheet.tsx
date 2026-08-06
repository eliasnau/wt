"use client";

import { Badge } from "@matdesk/ui/components/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@matdesk/ui/components/card";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { parseError } from "evlog";

import { orpc } from "@/utils/orpc";

type InvoiceSummary = {
  id: string;
  memberFirstName: string;
  memberLastName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: string;
  totalCents: number;
};

const STATUS_META: Record<string, { label: string; variant: "success" | "secondary" | "warning" }> =
  {
    draft: { label: "Entwurf", variant: "warning" },
    finalized: { label: "Finalisiert", variant: "success" },
    void: { label: "Storniert", variant: "secondary" },
  };

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { currency: "EUR", style: "currency" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("de-DE");
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-medium text-sm">{value}</dd>
    </div>
  );
}

export function InvoiceDetailsSheet({
  invoice,
  onOpenChange,
}: {
  invoice: InvoiceSummary;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useQuery(orpc.billing.getInvoice.queryOptions({ input: { id: invoice.id } }));
  const status = STATUS_META[invoice.status] ?? {
    label: invoice.status,
    variant: "secondary" as const,
  };

  return (
    <Sheet onOpenChange={onOpenChange} open>
      <SheetPopup className="max-w-2xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle>Rechnung {invoice.id.slice(0, 8).toUpperCase()}</SheetTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <SheetDescription>
            {invoice.memberFirstName} {invoice.memberLastName} ·{" "}
            {formatDate(invoice.billingPeriodStart)}
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="flex flex-col gap-5">
          <CardFrame>
            <CardFrameHeader>
              <CardFrameTitle>Übersicht</CardFrameTitle>
              <CardFrameDescription>Abrechnungszeitraum und Gesamtbetrag.</CardFrameDescription>
            </CardFrameHeader>
            <Card>
              <CardPanel>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    label="Mitglied"
                    value={`${invoice.memberFirstName} ${invoice.memberLastName}`}
                  />
                  <Detail label="Gesamt" value={formatCurrency(invoice.totalCents)} />
                  <Detail label="Zeitraum von" value={formatDate(invoice.billingPeriodStart)} />
                  <Detail label="Zeitraum bis" value={formatDate(invoice.billingPeriodEnd)} />
                </dl>
              </CardPanel>
            </Card>
          </CardFrame>

          <CardFrame>
            <CardFrameHeader>
              <CardFrameTitle>Rechnungspositionen</CardFrameTitle>
              <CardFrameDescription>Zusammensetzung des Rechnungsbetrags.</CardFrameDescription>
            </CardFrameHeader>
            {detailQuery.isPending ? (
              <Card>
                <CardPanel className="flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardPanel>
              </Card>
            ) : detailQuery.isError ? (
              <Card>
                <CardPanel className="text-destructive text-sm">
                  {parseError(detailQuery.error).message}
                </CardPanel>
              </Card>
            ) : (
              <Table className="min-w-[520px]" variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                    <TableHead className="text-right">Einzelpreis</TableHead>
                    <TableHead className="text-right">Gesamt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailQuery.data.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{line.description}</div>
                        {line.coverageStart && line.coverageEnd ? (
                          <div className="mt-0.5 text-muted-foreground text-xs">
                            {formatDate(line.coverageStart)} bis {formatDate(line.coverageEnd)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(line.unitAmountCents)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(line.totalAmountCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardFrame>

          {detailQuery.data?.sepaBatchItems.length ? (
            <CardFrame>
              <CardFrameHeader>
                <CardFrameTitle>SEPA-Einzüge</CardFrameTitle>
                <CardFrameDescription>
                  Sammeleinzüge, die diese Rechnung enthalten.
                </CardFrameDescription>
              </CardFrameHeader>
              <Table className="min-w-[480px]" variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Einzugsdatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailQuery.data.sepaBatchItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.batchNumber}</TableCell>
                      <TableCell>{formatDate(item.collectionDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.batchStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(item.amountCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardFrame>
          ) : null}
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
}
