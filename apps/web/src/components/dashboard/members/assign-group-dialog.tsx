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
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

export function AssignGroupDialog({
  open,
  onOpenChange,
  memberId,
  assignedGroupIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  assignedGroupIds: string[];
}) {
  const groupsQuery = useQuery(orpc.groups.list.queryOptions({}));
  const assigned = new Set(assignedGroupIds);
  const available = (groupsQuery.data ?? []).filter((g) => !assigned.has(g.id));

  const [groupId, setGroupId] = useState("");
  const [price, setPrice] = useState("");
  // Tracks whether the user edited the price, so switching groups can refresh
  // the default without clobbering a manual value.
  const [priceTouched, setPriceTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setGroupId("");
      setPrice("");
      setPriceTouched(false);
    }
  }, [open]);

  function selectGroup(id: string) {
    setGroupId(id);
    if (!priceTouched) {
      const group = available.find((g) => g.id === id);
      setPrice(
        group?.defaultMembershipPriceCents != null
          ? String(group.defaultMembershipPriceCents / 100)
          : "",
      );
    }
  }

  const mutation = useMutation(
    orpc.members.assignGroup.mutationOptions({
      onSuccess: () => {
        toast.success("Gruppe zugewiesen");
        queryClient.invalidateQueries({
          queryKey: orpc.members.get.key({ input: { memberId } }),
        });
        queryClient.invalidateQueries({ queryKey: orpc.members.query.key() });
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  function submit() {
    if (!groupId) return;
    const trimmed = price.trim();
    const cents = trimmed === "" ? undefined : Math.max(0, Math.round(Number(trimmed) * 100));
    mutation.mutate({
      memberId,
      groupId,
      membershipPriceCents: Number.isFinite(cents) ? cents : undefined,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Gruppe zuweisen</DialogTitle>
          <DialogDescription>Weise das Mitglied einer weiteren Gruppe zu.</DialogDescription>
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
              <FieldLabel>Gruppe</FieldLabel>
              <Select
                items={available.map((g) => ({ label: g.name, value: g.id }))}
                onValueChange={(value) => selectGroup(value as string)}
                value={groupId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      available.length === 0 ? "Keine Gruppen verfügbar" : "Gruppe wählen"
                    }
                  />
                </SelectTrigger>
                <SelectPopup>
                  {available.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Monatsbeitrag</FieldLabel>
              <InputGroup>
                <InputGroupAddon>€</InputGroupAddon>
                <InputGroupInput
                  min="0"
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setPriceTouched(true);
                  }}
                  placeholder="0,00"
                  step="0.01"
                  type="number"
                  value={price}
                />
              </InputGroup>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button disabled={!groupId} loading={mutation.isPending} type="submit">
              Zuweisen
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
