"use client";

import { Button } from "@matdesk/ui/components/button";
import { Checkbox } from "@matdesk/ui/components/checkbox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@matdesk/ui/components/dialog";
import { Label } from "@matdesk/ui/components/label";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@matdesk/ui/components/number-field";
import { Radio, RadioGroup } from "@matdesk/ui/components/radio-group";
import { Loader2Icon, PrinterIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { FilterClause } from "@/components/dashboard/members/advanced-filters";
import { client } from "@/utils/orpc";

type MemberStatus = "active" | "cancelled_but_active" | "cancelled";
type SortField = "createdAt" | "lastName" | "firstName" | "email";
type PrintField = "name" | "email" | "phone";

interface MemberPrintDialogProps {
  filterMode: "and" | "or";
  filters: FilterClause[];
  groups: string[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  search?: string;
  sort: { direction: "asc" | "desc"; field: SortField };
  statuses: MemberStatus[];
  totalCount: number;
}

const FIELD_OPTIONS: Array<{ key: PrintField; label: string }> = [
  { key: "name", label: "Name" },
  { key: "email", label: "E-Mail" },
  { key: "phone", label: "Telefon" },
];

function escapeHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function MemberPrintDialog({
  filterMode,
  filters,
  groups,
  onOpenChange,
  open,
  search,
  sort,
  statuses,
  totalCount,
}: MemberPrintDialogProps) {
  const [fields, setFields] = useState<Set<PrintField>>(new Set(["name"]));
  const [blankColumns, setBlankColumns] = useState(0);
  const [blankRows, setBlankRows] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isPrinting, setIsPrinting] = useState(false);

  function toggleField(field: PrintField) {
    setFields((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  async function printMembers() {
    if (fields.size === 0) {
      toast.error("Wähle mindestens eine Datenspalte aus.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Das Druckfenster wurde vom Browser blockiert.");
      return;
    }

    printWindow.document.write(
      '<!doctype html><html><head><title>Mitgliederliste</title></head><body style="font-family: sans-serif; padding: 32px">Mitgliederliste wird vorbereitet…</body></html>',
    );
    printWindow.document.close();
    setIsPrinting(true);

    try {
      const commonInput = {
        search,
        statuses: statuses.length > 0 ? statuses : undefined,
        groups: groups.length > 0 ? { mode: "any" as const, ids: groups } : undefined,
        filterMode,
        filters: filters.length > 0 ? filters : undefined,
        sort,
      };
      const firstPage = await client.members.query({ ...commonInput, page: 1, limit: 100 });
      const remainingPages = Array.from(
        { length: Math.max(0, firstPage.pagination.totalPages - 1) },
        (_, index) => index + 2,
      );
      const remainingResults = await Promise.all(
        remainingPages.map((page) => client.members.query({ ...commonInput, page, limit: 100 })),
      );
      const members = [firstPage, ...remainingResults].flatMap((result) => result.data);
      const selectedFields = FIELD_OPTIONS.filter(({ key }) => fields.has(key));
      const blankHeaders = Array.from(
        { length: blankColumns },
        () => '<th class="blank-column"></th>',
      ).join("");
      const dataHeaders = selectedFields
        .map(({ label }) => `<th>${escapeHtml(label)}</th>`)
        .join("");
      const blankCells = Array.from({ length: blankColumns }, () => "<td></td>").join("");
      const memberRows = members
        .map((member) => {
          const values: Record<PrintField, string> = {
            name: `${member.firstName} ${member.lastName}`.trim(),
            email: member.email ?? "",
            phone: member.phone ?? "",
          };
          return `<tr>${selectedFields
            .map(({ key }) => `<td>${escapeHtml(values[key])}</td>`)
            .join("")}${blankCells}</tr>`;
        })
        .join("");
      const emptyRows = Array.from(
        { length: blankRows },
        () => `<tr>${selectedFields.map(() => "<td></td>").join("")}${blankCells}</tr>`,
      ).join("");

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <title>Mitgliederliste</title>
    <style>
      @page { size: A4 ${orientation}; margin: 12mm; }
      * { box-sizing: border-box; }
      body { color: #17202a; font-family: Arial, sans-serif; font-size: 9.5pt; margin: 0; }
      .document-header { align-items: end; border-bottom: 2px solid #17202a; display: flex; justify-content: space-between; margin-bottom: 5mm; padding-bottom: 3mm; }
      h1 { font-size: 18pt; letter-spacing: -.02em; line-height: 1; margin: 0; }
      .meta { color: #667085; font-size: 8.5pt; margin: 0; }
      table { border-collapse: collapse; table-layout: fixed; width: 100%; }
      th, td { border: 1px solid #c9ced6; height: 8mm; overflow-wrap: anywhere; padding: 1.5mm 2.25mm; text-align: left; vertical-align: middle; }
      th { background: #293443; border-color: #293443; color: #fff; font-size: 8pt; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
      th.blank-column { text-align: center; width: 12%; }
      tbody tr:nth-child(even) td { background: #f5f7f9; }
      tbody tr:last-child td { border-bottom-color: #8f98a5; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; page-break-inside: avoid; }
    </style>
  </head>
  <body>
    <header class="document-header">
      <h1>Mitgliederliste</h1>
      <p class="meta">${members.length} Mitglieder&nbsp;&nbsp;·&nbsp;&nbsp;${new Intl.DateTimeFormat("de-DE").format(new Date())}</p>
    </header>
    <table>
      <thead><tr>${dataHeaders}${blankHeaders}</tr></thead>
      <tbody>${memberRows}${emptyRows}</tbody>
    </table>
    <script>window.addEventListener("load", () => { window.focus(); window.print(); });<\/script>
  </body>
</html>`);
      printWindow.document.close();
      onOpenChange(false);
    } catch (error) {
      printWindow.close();
      toast.error(error instanceof Error ? error.message : "Die Mitgliederliste konnte nicht geladen werden.");
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Mitgliederliste drucken</DialogTitle>
          <DialogDescription>
            Es werden alle {totalCount} Mitglieder gedruckt, die den aktuellen Filtern entsprechen.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="font-medium text-sm">Daten anzeigen</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {FIELD_OPTIONS.map((option) => (
                <Label key={option.key} className="rounded-lg border p-3">
                  <Checkbox
                    checked={fields.has(option.key)}
                    onCheckedChange={() => toggleField(option.key)}
                  />
                  {option.label}
                </Label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              max={10}
              min={0}
              onValueChange={(value) => setBlankColumns(value ?? 0)}
              value={blankColumns}
            >
              <Label>Leere Spalten rechts</Label>
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput aria-label="Leere Spalten rechts" />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
            <NumberField
              max={100}
              min={0}
              onValueChange={(value) => setBlankRows(value ?? 0)}
              value={blankRows}
            >
              <Label>Zusätzliche leere Zeilen</Label>
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput aria-label="Zusätzliche leere Zeilen" />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
          </div>

          <fieldset className="space-y-3">
            <legend className="font-medium text-sm">Ausrichtung</legend>
            <RadioGroup
              className="grid grid-cols-2 gap-3"
              onValueChange={(value) => setOrientation(value as "portrait" | "landscape")}
              value={orientation}
            >
              <Label className="rounded-lg border p-3">
                <Radio value="portrait" />
                Hochformat
              </Label>
              <Label className="rounded-lg border p-3">
                <Radio value="landscape" />
                Querformat
              </Label>
            </RadioGroup>
          </fieldset>
        </DialogPanel>
        <DialogFooter>
          <Button disabled={isPrinting} onClick={() => onOpenChange(false)} variant="outline">
            Abbrechen
          </Button>
          <Button disabled={isPrinting || totalCount === 0 || fields.size === 0} onClick={printMembers}>
            {isPrinting ? <Loader2Icon className="animate-spin" /> : <PrinterIcon />}
            {isPrinting ? "Liste wird geladen…" : "Drucken"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
