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
import { Input } from "@matdesk/ui/components/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { cn } from "@matdesk/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  defaultMembershipPriceCents: number | null;
  progressionSystemId: string | null;
};

const COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function GroupDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: GroupRow | null;
}) {
  const isEdit = Boolean(group);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [price, setPrice] = useState("");
  const [progressionSystemId, setProgressionSystemId] = useState("");
  const queryClient = useQueryClient();
  const systemsQuery = useQuery({
    ...orpc.progression.listSystems.queryOptions(),
    enabled: open,
  });

  // Prefill (edit) / reset (create) whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName(group?.name ?? "");
    setDescription(group?.description ?? "");
    setColor(group?.color ?? "#3b82f6");
    setPrice(
      group?.defaultMembershipPriceCents != null
        ? String(group.defaultMembershipPriceCents / 100)
        : "",
    );
    setProgressionSystemId(group?.progressionSystemId ?? "none");
  }, [open, group]);

  function onDone(message: string) {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: orpc.groups.key() });
    onOpenChange(false);
  }

  const createMutation = useMutation(
    orpc.groups.create.mutationOptions({
      onSuccess: () => onDone("Gruppe erstellt"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const updateMutation = useMutation(
    orpc.groups.update.mutationOptions({
      onSuccess: () => onDone("Gruppe aktualisiert"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  function submit() {
    const priceCents = price.trim() === "" ? undefined : Math.round(Number(price) * 100);
    if (isEdit && group) {
      updateMutation.mutate({
        id: group.id,
        name,
        description: description || undefined,
        color,
        defaultMembershipPriceCents: priceCents ?? null,
        progressionSystemId: progressionSystemId === "none" ? null : progressionSystemId,
      });
    } else {
      createMutation.mutate({
        name,
        description: description || undefined,
        color,
        defaultMembershipPriceCents: priceCents,
        progressionSystemId: progressionSystemId === "none" ? null : progressionSystemId,
      });
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Gruppe bearbeiten" : "Gruppe erstellen"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Aktualisiere die Details dieser Gruppe."
              : "Lege eine neue Gruppe für deine Mitglieder an."}
          </DialogDescription>
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
              <FieldLabel>Name</FieldLabel>
              <Input
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Karate"
                value={name}
              />
            </Field>
            <Field>
              <FieldLabel>Beschreibung</FieldLabel>
              <Input
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                value={description}
              />
            </Field>
            <Field>
              <FieldLabel>Farbe</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    aria-label={preset}
                    className={cn(
                      "size-7 cursor-pointer rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                      color.toLowerCase() === preset
                        ? "ring-2 ring-ring"
                        : "ring-1 ring-foreground/10",
                    )}
                    key={preset}
                    onClick={() => setColor(preset)}
                    style={{ backgroundColor: preset }}
                    type="button"
                  />
                ))}
              </div>
              <Input
                className="mt-2 font-mono"
                onChange={(e) => setColor(e.target.value)}
                value={color}
              />
            </Field>
            <Field>
              <FieldLabel>Graduierungssystem</FieldLabel>
              <Select
                items={[
                  { value: "none", label: "Keines" },
                  ...(systemsQuery.data ?? []).map((system) => ({
                    value: system.id,
                    label: system.name,
                  })),
                ]}
                onValueChange={(value) => setProgressionSystemId(String(value))}
                value={progressionSystemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keines" />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="none">Keines</SelectItem>
                  {systemsQuery.data?.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                      {system.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Standardbeitrag (€)</FieldLabel>
              <Input
                min="0"
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Optional"
                step="0.01"
                type="number"
                value={price}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button disabled={!name} loading={pending} type="submit">
              {isEdit ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
