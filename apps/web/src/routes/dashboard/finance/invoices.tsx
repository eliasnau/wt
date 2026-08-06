"use client";

import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@matdesk/ui/components/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import { EyeIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { InvoiceDetailsSheet } from "@/components/dashboard/finance/invoice-details-sheet";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/finance/invoices")({
  component: InvoicesPage,
});

type InvoiceStatus = "draft" | "finalized" | "void";

type InvoiceSummary = {
  id: string;
  memberId: string;
  memberFirstName: string;
  memberLastName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: string;
  totalCents: number;
};

const STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "finalized", label: "Finalisiert" },
  { value: "draft", label: "Entwurf" },
  { value: "void", label: "Storniert" },
];

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

function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(null);
  const search = useDeferredValue(searchInput.trim());

  const invoicesQuery = useQuery(
    orpc.billing.listInvoices.queryOptions({
      input: {
        page,
        limit: 20,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        from: from || undefined,
        to: to || undefined,
      },
      placeholderData: keepPreviousData,
    }),
  );

  const invoices = invoicesQuery.data?.data ?? [];
  const pagination = invoicesQuery.data?.pagination;
  const hasFilters = Boolean(searchInput || status !== "all" || from || to);

  function resetFilters() {
    setSearchInput("");
    setStatus("all");
    setFrom("");
    setTo("");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Rechnungen</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Rechnungen durchsuchen, filtern und im Detail prüfen.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:w-full lg:flex-row lg:items-end lg:justify-between">
        <InputGroup className="w-full lg:w-80">
          <InputGroupAddon>
            {invoicesQuery.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
          </InputGroupAddon>
          <InputGroupInput
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder="Name oder Rechnungsnummer suchen…"
            value={searchInput}
          />
        </InputGroup>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Field className="w-full lg:w-44">
            <FieldLabel>Status</FieldLabel>
            <Select
              items={[{ label: "Alle Status", value: "all" }, ...STATUS_OPTIONS]}
              onValueChange={(value) => {
                setStatus(value as InvoiceStatus | "all");
                setPage(1);
              }}
              value={status}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="all">Alle Status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field className="w-full lg:w-44">
            <FieldLabel htmlFor="invoice-from">Zeitraum von</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="invoice-from"
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
                type="date"
                value={from}
              />
            </InputGroup>
          </Field>
          <Field className="w-full lg:w-44">
            <FieldLabel htmlFor="invoice-to">Zeitraum bis</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="invoice-to"
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
                type="date"
                value={to}
              />
            </InputGroup>
          </Field>
          {hasFilters ? (
            <Button onClick={resetFilters} variant="ghost">
              <XIcon />
              Zurücksetzen
            </Button>
          ) : null}
        </div>
      </div>

      <CardFrame className="w-full min-w-0 overflow-hidden">
        <Table className="min-w-[820px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Rechnung</TableHead>
              <TableHead>Mitglied</TableHead>
              <TableHead>Abrechnungszeitraum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Gesamt</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoicesQuery.isPending ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`invoice-skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : invoicesQuery.isError ? (
              <TableRow>
                <TableCell className="py-12 text-center text-destructive" colSpan={6}>
                  {parseError(invoicesQuery.error).message}
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell className="py-12 text-center text-muted-foreground" colSpan={6}>
                  {hasFilters
                    ? "Keine Rechnungen entsprechen den gewählten Filtern."
                    : "Noch keine Rechnungen vorhanden."}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const statusMeta = STATUS_META[invoice.status] ?? {
                  label: invoice.status,
                  variant: "secondary" as const,
                };
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">
                      {invoice.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="font-medium hover:underline"
                        params={{ memberId: invoice.memberId }}
                        to="/dashboard/members/$memberId"
                      >
                        {invoice.memberFirstName} {invoice.memberLastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.billingPeriodStart)} –{" "}
                      {formatDate(invoice.billingPeriodEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(invoice.totalCents)}
                    </TableCell>
                    <TableCell>
                      <Button
                        aria-label={`Rechnung für ${invoice.memberFirstName} ${invoice.memberLastName} ansehen`}
                        onClick={() => setSelectedInvoice(invoice)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <EyeIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-2 !py-2" colSpan={6}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground text-sm">
                    <strong className="font-medium text-foreground">
                      {pagination?.totalCount ?? 0}
                    </strong>{" "}
                    Rechnungen
                  </span>
                  <Pagination className="justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <span className="hidden text-muted-foreground text-sm sm:inline">
                          Seite {pagination?.page ?? 1} von {pagination?.totalPages ?? 1}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationPrevious
                          render={
                            <Button
                              disabled={!pagination?.hasPreviousPage}
                              onClick={() => setPage((current) => Math.max(1, current - 1))}
                              size="sm"
                              variant="outline"
                            />
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          render={
                            <Button
                              disabled={!pagination?.hasNextPage}
                              onClick={() => setPage((current) => current + 1)}
                              size="sm"
                              variant="outline"
                            />
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardFrame>

      {selectedInvoice ? (
        <InvoiceDetailsSheet
          invoice={selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
        />
      ) : null}
    </div>
  );
}
