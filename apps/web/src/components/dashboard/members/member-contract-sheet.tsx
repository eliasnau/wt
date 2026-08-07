"use client";

import { Button } from "@matdesk/ui/components/button";
import { Field, FieldDescription, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export type ContractMember = {
  id: string;
  joiningFeeCents: number | null;
  yearlyFeeCents: number | null;
};

function euroString(cents: number | null) {
  return cents == null ? "" : String(cents / 100);
}

function eurosToCents(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.round(n * 100));
}

export function MemberContractSheet({
  open,
  onOpenChange,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ContractMember;
}) {
  const queryClient = useQueryClient();
  const [joiningFee, setJoiningFee] = useState("");
  const [yearlyFee, setYearlyFee] = useState("");

  useEffect(() => {
    if (!open) return;
    setJoiningFee(euroString(member.joiningFeeCents));
    setYearlyFee(euroString(member.yearlyFeeCents));
  }, [open, member]);

  const mutation = useMutation(
    orpc.members.updateContract.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.members.get.key({ input: { memberId: member.id } }),
        });
        void queryClient.invalidateQueries({ queryKey: orpc.members.query.key() });
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  function submit() {
    mutation.mutate({
      memberId: member.id,
      joiningFeeCents: eurosToCents(joiningFee),
      yearlyFeeCents: eurosToCents(yearlyFee),
    });
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetPopup>
        <SheetHeader>
          <SheetTitle>Beiträge bearbeiten</SheetTitle>
          <SheetDescription>Aufnahmegebühr und Jahresbeitrag des Vertrags.</SheetDescription>
        </SheetHeader>
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <SheetPanel className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Aufnahmegebühr (€)</FieldLabel>
              <Input
                min="0"
                onChange={(e) => setJoiningFee(e.target.value)}
                placeholder="0,00"
                step="0.01"
                type="number"
                value={joiningFee}
              />
              <FieldDescription>Leer lassen, um keine Gebühr zu berechnen.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Jahresbeitrag (€)</FieldLabel>
              <Input
                min="0"
                onChange={(e) => setYearlyFee(e.target.value)}
                placeholder="0,00"
                step="0.01"
                type="number"
                value={yearlyFee}
              />
            </Field>
          </SheetPanel>
          <SheetFooter>
            <SheetClose render={<Button variant="ghost" />}>Abbrechen</SheetClose>
            <Button loading={mutation.isPending} type="submit">
              Speichern
            </Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  );
}
