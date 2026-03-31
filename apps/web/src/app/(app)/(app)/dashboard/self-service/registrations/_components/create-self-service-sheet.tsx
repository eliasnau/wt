"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/utils/orpc";

type GroupRow = {
  id: string;
  groupId: string;
  monthlyFee: string;
  schedule: string;
};

const BILLING_CYCLE_ITEMS = [
  { value: "monthly", label: "Monatlich" },
  { value: "half_yearly", label: "Halbjaehrlich" },
  { value: "yearly", label: "Jaehrlich" },
] as const;

type CreateSelfServiceSheetProps = {
  onCreated?: () => void;
};

function makeGroupRow(): GroupRow {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    groupId: "",
    monthlyFee: "",
    schedule: "",
  };
}

export function CreateSelfServiceSheet({ onCreated }: CreateSelfServiceSheetProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "half_yearly" | "yearly">(
    "monthly",
  );
  const [joiningFeeAmount, setJoiningFeeAmount] = useState("");
  const [yearlyFeeAmount, setYearlyFeeAmount] = useState("");
  const [contractStartMonth, setContractStartMonth] = useState("");
  const [notes, setNotes] = useState("");
  const [groups, setGroups] = useState<GroupRow[]>([makeGroupRow()]);

  const { data: allGroups = [] } = useQuery(
    orpc.groups.list.queryOptions({
      input: {},
    }),
  );

  const selectedGroupIds = useMemo(
    () => new Set(groups.map((group) => group.groupId).filter(Boolean)),
    [groups],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("Name ist erforderlich");
      }

      const payloadGroups = groups
        .filter((group) => group.groupId.trim().length > 0)
        .map((group) => ({
          groupId: group.groupId,
          monthlyFee: group.monthlyFee.trim(),
          schedule: group.schedule.trim() || undefined,
        }));

      if (payloadGroups.length === 0) {
        throw new Error("Mindestens eine Gruppe ist erforderlich");
      }

      for (const item of payloadGroups) {
        if (!item.monthlyFee.match(/^\d+(\.\d{1,2})?$/)) {
          throw new Error("Gruppenpreis muss ein gueltiger Betrag sein (z.B. 69 oder 69.00)");
        }
      }

      if (joiningFeeAmount && !joiningFeeAmount.match(/^\d+(\.\d{1,2})?$/)) {
        throw new Error("Aufnahmegebuehr ist ungueltig");
      }

      if (yearlyFeeAmount && !yearlyFeeAmount.match(/^\d+(\.\d{1,2})?$/)) {
        throw new Error("Jahresbeitrag ist ungueltig");
      }

      return client.selfRegistrations.create({
        name: name.trim(),
        description: description.trim() || undefined,
        billingCycle,
        joiningFeeAmount: joiningFeeAmount.trim() || undefined,
        yearlyFeeAmount: yearlyFeeAmount.trim() || undefined,
        contractStartDate: contractStartMonth ? `${contractStartMonth}-01` : undefined,
        notes: notes.trim() || undefined,
        groups: payloadGroups,
      });
    },
    onSuccess: (created) => {
      toast.success("Self-Service Registrierung erstellt");
      onCreated?.();
      setOpen(false);
      setName("");
      setDescription("");
      setBillingCycle("monthly");
      setJoiningFeeAmount("");
      setYearlyFeeAmount("");
      setContractStartMonth("");
      setNotes("");
      setGroups([makeGroupRow()]);
      if (created?.code) {
        toast.message(`Code: ${created.code}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Self-Service Registrierung konnte nicht erstellt werden");
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Neue Self-Service Registrierung
      </SheetTrigger>
      <SheetPopup inset>
        <SheetHeader>
          <SheetTitle>Self-Service erstellen</SheetTitle>
          <SheetDescription>
            Erstelle eine neue Self-Service Registrierung fuer genau ein Mitglied.
            Der 8-stellige Code wird automatisch generiert.
          </SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-5">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="ss-name">
              Name *
            </label>
            <Input
              id="ss-name"
              placeholder="Max Mustermann"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="ss-description">
              Beschreibung
            </label>
            <Textarea
              id="ss-description"
              rows={3}
              placeholder="Optionaler interner Hinweis"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="ss-billing">
                Vertragslaufzeit
              </label>
              <p className="text-muted-foreground text-xs">Abrechnung erfolgt immer monatlich.</p>
              <Select
                items={BILLING_CYCLE_ITEMS}
                value={billingCycle}
                onValueChange={(value) =>
                  setBillingCycle(value as "monthly" | "half_yearly" | "yearly")
                }
              >
                <SelectTrigger id="ss-billing">
                  <SelectValue placeholder="Laufzeit" />
                </SelectTrigger>
                <SelectPopup>
                  {BILLING_CYCLE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="ss-contract-start">
                Vertragsbeginn
              </label>
              <Input
                id="ss-contract-start"
                type="month"
                value={contractStartMonth}
                onChange={(event) => setContractStartMonth(event.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="ss-joining-fee">
                Aufnahmegebuehr
              </label>
              <InputGroup>
                <InputGroupInput
                  id="ss-joining-fee"
                  placeholder="25.00"
                  value={joiningFeeAmount}
                  onChange={(event) => setJoiningFeeAmount(event.target.value)}
                  disabled={createMutation.isPending}
                />
                <InputGroupAddon>
                  <InputGroupText>EUR</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="font-medium text-sm" htmlFor="ss-yearly-fee">
                Jahresbeitrag
              </label>
              <InputGroup>
                <InputGroupInput
                  id="ss-yearly-fee"
                  placeholder="120.00"
                  value={yearlyFeeAmount}
                  onChange={(event) => setYearlyFeeAmount(event.target.value)}
                  disabled={createMutation.isPending}
                />
                <InputGroupAddon>
                  <InputGroupText>EUR</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Gruppen</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGroups((prev) => [...prev, makeGroupRow()])}
                disabled={createMutation.isPending}
              >
                <PlusIcon data-icon="inline-start" />
                Gruppe
              </Button>
            </div>

            <div className="space-y-3">
              {groups.map((row) => (
                <div key={row.id} className="rounded-lg border p-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="font-medium text-xs">Gruppe *</label>
                      <Select
                        items={allGroups.map((group) => ({
                          value: group.id,
                          label: group.name,
                          disabled:
                            selectedGroupIds.has(group.id) && row.groupId !== group.id,
                        }))}
                        value={row.groupId}
                        onValueChange={(value) =>
                          setGroups((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, groupId: value ?? "" }
                                : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Gruppe waehlen" />
                        </SelectTrigger>
                        <SelectPopup>
                          {allGroups.map((group) => {
                            const alreadySelected =
                              selectedGroupIds.has(group.id) && row.groupId !== group.id;

                            return (
                              <SelectItem
                                key={group.id}
                                value={group.id}
                                disabled={alreadySelected}
                              >
                                {group.name}
                              </SelectItem>
                            );
                          })}
                        </SelectPopup>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium text-xs">Monatsbeitrag * </label>
                      <InputGroup>
                        <InputGroupInput
                          placeholder="69.00"
                          value={row.monthlyFee}
                          onChange={(event) =>
                            setGroups((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? { ...item, monthlyFee: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <InputGroupAddon>
                          <InputGroupText>EUR</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="font-medium text-xs">Zeitplan</label>
                      <Input
                        placeholder="Mittwoch, 18:00 - 19:30"
                        value={row.schedule}
                        onChange={(event) =>
                          setGroups((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, schedule: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>

                  {groups.length > 1 ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setGroups((prev) => prev.filter((item) => item.id !== row.id))
                        }
                        disabled={createMutation.isPending}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        Entfernen
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="ss-notes">
              Notizen
            </label>
            <Textarea
              id="ss-notes"
              rows={3}
              placeholder="Interne Notizen zur Registrierung"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
        </SheetPanel>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
          >
            Abbrechen
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
