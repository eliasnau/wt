"use client";

import { Button } from "@matdesk/ui/components/button";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { Textarea } from "@matdesk/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { memberTimelineQueryOptions } from "@/queries/members";
import { client, orpc, queryClient } from "@/utils/orpc";

// Derived from the procedure's input rather than hand-written. The chain is
// `credit_grant_type` pg enum → `creditGrantTypeSchema` → this union → the
// label map below, so adding a grant type to the DB fails to compile here until
// it gets a German label instead of rendering `undefined`.
export type CreditGrantType = Parameters<typeof client.billing.createCreditGrant>[0]["type"];

export const CREDIT_GRANT_TYPE_LABELS: Record<CreditGrantType, string> = {
  billing_cycles: "Freie Monate",
  money: "Guthaben (Euro)",
};

const TYPE_ITEMS = [
  { label: CREDIT_GRANT_TYPE_LABELS.money, value: "money" },
  { label: CREDIT_GRANT_TYPE_LABELS.billing_cycles, value: "billing_cycles" },
];

export function CreditGrantDialog({
  open,
  onOpenChange,
  memberId,
  contractId,
  memberName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  contractId: string;
  memberName: string;
}) {
  const [type, setType] = useState<CreditGrantType>("money");
  const [amount, setAmount] = useState("");
  const [cycles, setCycles] = useState("");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setType("money");
      setAmount("");
      setCycles("");
      setDescription("");
      setValidFrom("");
      setExpiresAt("");
      setNotes("");
    }
  }, [open]);

  const mutation = useMutation(
    orpc.billing.createCreditGrant.mutationOptions({
      onSuccess: () => {
        toast.success("Guthaben erstellt");
        void queryClient.invalidateQueries({
          queryKey: orpc.billing.listCreditGrants.key({ input: { memberId } }),
        });
        void queryClient.invalidateQueries({
          queryKey: memberTimelineQueryOptions(memberId).queryKey,
        });
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const amountCents = Math.round(Number(amount.replace(",", ".")) * 100);
  const cycleCount = Number.parseInt(cycles, 10);
  const isValid =
    type === "money"
      ? Number.isFinite(amountCents) && amountCents > 0
      : Number.isInteger(cycleCount) && cycleCount > 0;
  // Both bounds are optional, but an inverted range would create a grant that
  // can never apply — catch it here rather than letting it reach the DB.
  const rangeInvalid = validFrom !== "" && expiresAt !== "" && expiresAt < validFrom;

  function submit() {
    if (!isValid || rangeInvalid) return;
    mutation.mutate({
      memberId,
      contractId,
      type,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      validFrom: validFrom || undefined,
      expiresAt: expiresAt || undefined,
      originalAmountCents: type === "money" ? amountCents : undefined,
      originalCycles: type === "billing_cycles" ? cycleCount : undefined,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guthaben hinzufügen</DialogTitle>
          <DialogDescription>Erstelle ein neues Guthaben für {memberName}.</DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DialogPanel className="grid gap-4">
            <Field>
              <FieldLabel>Typ</FieldLabel>
              <Select
                items={TYPE_ITEMS}
                onValueChange={(value) => setType(value as CreditGrantType)}
                value={type}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>

            {type === "money" ? (
              <Field>
                <FieldLabel>Betrag</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>€</InputGroupAddon>
                  <InputGroupInput
                    min="0.01"
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    type="number"
                    value={amount}
                  />
                </InputGroup>
                <FieldDescription>
                  Wird bei der Rechnungserstellung von zukünftigen Rechnungen abgezogen.
                </FieldDescription>
              </Field>
            ) : (
              <Field>
                <FieldLabel>Anzahl freie Monate</FieldLabel>
                <Input
                  min="1"
                  onChange={(e) => setCycles(e.target.value)}
                  placeholder="1"
                  step="1"
                  type="number"
                  value={cycles}
                />
                <FieldDescription>
                  Der Mitgliedsbeitrag wird für diese Anzahl Monate erlassen.
                </FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel>Beschreibung</FieldLabel>
              <Input
                maxLength={255}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z. B. Werbeaktion, Kulanz, Korrektur…"
                value={description}
              />
              <FieldDescription>Optional — erscheint auf der Guthaben-Übersicht.</FieldDescription>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Gültig ab</FieldLabel>
                <Input
                  onChange={(e) => setValidFrom(e.target.value)}
                  type="date"
                  value={validFrom}
                />
              </Field>
              <Field>
                <FieldLabel>Gültig bis</FieldLabel>
                <Input
                  aria-invalid={rangeInvalid}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  type="date"
                  value={expiresAt}
                />
                {rangeInvalid ? (
                  <FieldDescription className="text-destructive">
                    Muss nach „Gültig ab" liegen.
                  </FieldDescription>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel>Interne Notiz</FieldLabel>
              <Textarea
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nur intern sichtbar…"
                rows={3}
                value={notes}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button disabled={!isValid || rangeInvalid} loading={mutation.isPending} type="submit">
              Erstellen
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
