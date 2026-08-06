"use client";

import { Button } from "@matdesk/ui/components/button";
import { Input } from "@matdesk/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@matdesk/ui/components/popover";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { FilterIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export type FilterFieldKey =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "phone"
  | "street"
  | "city"
  | "state"
  | "postalCode"
  | "country"
  | "notes"
  | "birthdate"
  | "startDate"
  | "joiningFeeCents"
  | "yearlyFeeCents"
  | "groupCount";

type ValueOperator = "contains" | "startsWith" | "endsWith" | "eq" | "neq" | "gte" | "lte";
type Operator = ValueOperator | "isNull" | "isNotNull";

export type FilterClause =
  | { field: FilterFieldKey; operator: ValueOperator; value: string }
  | { field: FilterFieldKey; operator: "isNull" | "isNotNull" };

type FieldType = "text" | "number" | "date";

const FIELDS: Array<{ value: FilterFieldKey; label: string; type: FieldType }> = [
  { value: "firstName", label: "Vorname", type: "text" },
  { value: "lastName", label: "Nachname", type: "text" },
  { value: "fullName", label: "Voller Name", type: "text" },
  { value: "email", label: "E-Mail", type: "text" },
  { value: "phone", label: "Telefon", type: "text" },
  { value: "street", label: "Straße", type: "text" },
  { value: "city", label: "Stadt", type: "text" },
  { value: "state", label: "Bundesland", type: "text" },
  { value: "postalCode", label: "PLZ", type: "text" },
  { value: "country", label: "Land", type: "text" },
  { value: "notes", label: "Notizen", type: "text" },
  { value: "birthdate", label: "Geburtsdatum", type: "date" },
  { value: "startDate", label: "Startdatum", type: "date" },
  { value: "joiningFeeCents", label: "Aufnahmegebühr (Cent)", type: "number" },
  { value: "yearlyFeeCents", label: "Jahresbeitrag (Cent)", type: "number" },
  { value: "groupCount", label: "Anzahl Gruppen", type: "number" },
];

const OPERATORS: Array<{ value: Operator; label: string; needsValue: boolean }> = [
  { value: "contains", label: "enthält", needsValue: true },
  { value: "eq", label: "ist gleich", needsValue: true },
  { value: "neq", label: "ist ungleich", needsValue: true },
  { value: "startsWith", label: "beginnt mit", needsValue: true },
  { value: "endsWith", label: "endet mit", needsValue: true },
  { value: "gte", label: "größer/gleich", needsValue: true },
  { value: "lte", label: "kleiner/gleich", needsValue: true },
  { value: "isNull", label: "ist leer", needsValue: false },
  { value: "isNotNull", label: "ist nicht leer", needsValue: false },
];

function fieldType(field: FilterFieldKey): FieldType {
  return FIELDS.find((f) => f.value === field)?.type ?? "text";
}

function operatorNeedsValue(operator: Operator): boolean {
  return OPERATORS.find((o) => o.value === operator)?.needsValue ?? true;
}

type DraftRow = { id: string; field: FilterFieldKey; operator: Operator; value: string };

function clausesToRows(filters: FilterClause[]): DraftRow[] {
  return filters.map((clause) => ({
    id: crypto.randomUUID(),
    field: clause.field,
    operator: clause.operator,
    value: "value" in clause ? clause.value : "",
  }));
}

function rowsToClauses(rows: DraftRow[]): FilterClause[] {
  const clauses: FilterClause[] = [];
  for (const row of rows) {
    if (row.operator === "isNull" || row.operator === "isNotNull") {
      clauses.push({ field: row.field, operator: row.operator });
    } else if (row.value.trim() !== "") {
      clauses.push({ field: row.field, operator: row.operator, value: row.value.trim() });
    }
  }
  return clauses;
}

export function AdvancedFilters({
  filters,
  filterMode,
  onApply,
}: {
  filters: FilterClause[];
  filterMode: "and" | "or";
  onApply: (filters: FilterClause[], mode: "and" | "or") => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"and" | "or">(filterMode);
  const [rows, setRows] = useState<DraftRow[]>([]);

  // Sync the draft from the applied filters each time the popover opens.
  useEffect(() => {
    if (!open) return;
    setMode(filterMode);
    setRows(filters.length > 0 ? clausesToRows(filters) : []);
  }, [open, filters, filterMode]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: "lastName", operator: "contains", value: "" },
    ]);
  }

  function updateRow(id: string, patch: Partial<Omit<DraftRow, "id">>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function apply() {
    onApply(rowsToClauses(rows), mode);
    setOpen(false);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<Button variant="outline" />}>
        <FilterIcon />
        Filter
        {filters.length > 0 ? (
          <span className="ml-1 rounded bg-primary/10 px-1.5 text-primary text-xs">
            {filters.length}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,36rem)]">
        <div className="flex flex-col gap-3">
          {rows.length > 1 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>Treffer, wenn</span>
              <Select
                items={[
                  { label: "alle", value: "and" },
                  { label: "beliebige", value: "or" },
                ]}
                onValueChange={(value) => setMode(value as "and" | "or")}
                value={mode}
              >
                <SelectTrigger className="w-28" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  <SelectItem value="and">alle</SelectItem>
                  <SelectItem value="or">beliebige</SelectItem>
                </SelectPopup>
              </Select>
              <span>Bedingungen zutreffen</span>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <p className="py-2 text-muted-foreground text-sm">
              Noch keine Bedingungen. Füge eine hinzu, um präzise zu filtern.
            </p>
          ) : (
            rows.map((row) => (
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2" key={row.id}>
                <Select
                  items={FIELDS.map((f) => ({ label: f.label, value: f.value }))}
                  onValueChange={(value) => updateRow(row.id, { field: value as FilterFieldKey })}
                  value={row.field}
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup alignItemWithTrigger={false}>
                    {FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>

                <Select
                  items={OPERATORS.map((o) => ({ label: o.label, value: o.value }))}
                  onValueChange={(value) => updateRow(row.id, { operator: value as Operator })}
                  value={row.operator}
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup alignItemWithTrigger={false}>
                    {OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>

                {operatorNeedsValue(row.operator) ? (
                  <Input
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    placeholder="Wert"
                    type={fieldType(row.field)}
                    value={row.value}
                  />
                ) : (
                  <div />
                )}

                <Button
                  aria-label="Bedingung entfernen"
                  onClick={() => removeRow(row.id)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <XIcon />
                </Button>
              </div>
            ))
          )}

          <Button className="self-start" onClick={addRow} size="sm" variant="outline">
            <PlusIcon />
            Bedingung hinzufügen
          </Button>

          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <Button onClick={() => setRows([])} size="sm" variant="ghost">
              Zurücksetzen
            </Button>
            <Button onClick={apply} size="sm">
              Anwenden
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
