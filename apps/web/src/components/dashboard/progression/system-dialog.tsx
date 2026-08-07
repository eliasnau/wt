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
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@matdesk/ui/lib/utils";
import { parseError } from "evlog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export type ProgressionSystemRow = {
  id: string;
  name: string;
  unitLabel: string;
  mode: string;
};

const MODES = [
  { value: "sequential", label: "Aufeinanderfolgend" },
  { value: "collection", label: "Sammlung" },
];

const PRESETS = [
  {
    id: "judo_djb" as const,
    name: "Judo",
    detail: "DJB · 8. Kyu bis 9. Dan",
    colors: ["#facc15", "#f97316", "#22c55e", "#3b82f6", "#92400e", "#111827"],
  },
  {
    id: "taekwondo_dtu" as const,
    name: "Taekwondo",
    detail: "DTU · 10. Kup bis 9. Dan",
    colors: ["#f8fafc", "#facc15", "#22c55e", "#3b82f6", "#ef4444", "#111827"],
  },
  {
    id: "wing_tzun_wtfb" as const,
    name: "Wing Tzun / Wing Tzung",
    detail: "WTFB · 12 Schüler-, 4 Lehrer- und 4 Meistergrade",
    colors: ["#64748b", "#64748b", "#64748b", "#64748b", "#64748b", "#64748b"],
  },
];

type PresetId = (typeof PRESETS)[number]["id"];

export function SystemDialog({
  open,
  onOpenChange,
  system,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system?: ProgressionSystemRow | null;
}) {
  const [name, setName] = useState("");
  const [unitLabel, setUnitLabel] = useState("Graduierung");
  const [mode, setMode] = useState<"sequential" | "collection">("sequential");
  const [presetId, setPresetId] = useState<PresetId | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setName(system?.name ?? "");
    setUnitLabel(system?.unitLabel ?? "Graduierung");
    setMode(system?.mode === "collection" ? "collection" : "sequential");
    setPresetId(null);
  }, [open, system]);

  function done(message: string) {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: orpc.progression.key() });
    onOpenChange(false);
  }

  const create = useMutation(
    orpc.progression.createSystem.mutationOptions({
      onSuccess: () => done("Graduierungssystem erstellt"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const update = useMutation(
    orpc.progression.updateSystem.mutationOptions({
      onSuccess: () => done("Graduierungssystem aktualisiert"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const createPreset = useMutation(
    orpc.progression.createPreset.mutationOptions({
      onSuccess: () => done("Graduierungssystem aus Vorlage erstellt"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{system ? "System bearbeiten" : "System hinzufügen"}</DialogTitle>
          <DialogDescription>
            Ein eigenes System pro Sportart oder Graduierungsart.
          </DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            if (!system && presetId) createPreset.mutate({ presetId });
            else if (system) update.mutate({ systemId: system.id, name, unitLabel, mode });
            else create.mutate({ name, unitLabel, mode });
          }}
        >
          <DialogPanel className="grid gap-4">
            {!system ? (
              <Field>
                <FieldLabel>Vorlage</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-3">
                  {PRESETS.map((preset) => (
                    <button
                      className={cn(
                        "rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] hover:border-foreground/20 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring",
                        presetId === preset.id && "border-primary bg-accent/60 ring-1 ring-primary",
                      )}
                      key={preset.id}
                      onClick={() => setPresetId(presetId === preset.id ? null : preset.id)}
                      type="button"
                    >
                      <span className="block font-medium text-sm">{preset.name}</span>
                      <span className="mt-0.5 block text-muted-foreground text-xs">
                        {preset.detail}
                      </span>
                      <span className="mt-3 flex -space-x-1">
                        {preset.colors.map((color, index) => (
                          <span
                            aria-hidden="true"
                            className="size-4 rounded-full border border-background ring-1 ring-border"
                            key={`${color}-${index}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
                <FieldDescription>
                  Verbandstreue Vorlage auswählen oder darunter ein eigenes System erstellen.
                </FieldDescription>
              </Field>
            ) : null}
            {!presetId || system ? (
              <>
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    autoComplete="off"
                    autoFocus
                    name="progression-system-name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="z. B. Karate Kyu/Dan"
                    value={name}
                  />
                </Field>
                <Field>
                  <FieldLabel>Bezeichnung einer Stufe</FieldLabel>
                  <Input
                    autoComplete="off"
                    name="progression-unit-label"
                    onChange={(event) => setUnitLabel(event.target.value)}
                    placeholder="z. B. Gürtel"
                    value={unitLabel}
                  />
                </Field>
                <Field>
                  <FieldLabel>Art</FieldLabel>
                  <Select
                    items={MODES}
                    onValueChange={(value) =>
                      setMode(value === "collection" ? "collection" : "sequential")
                    }
                    value={mode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {MODES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FieldDescription>
                    {mode === "sequential"
                      ? "Mitglieder durchlaufen die Stufen in der festgelegten Reihenfolge."
                      : "Mitglieder können unabhängige Auszeichnungen sammeln."}
                  </FieldDescription>
                </Field>
              </>
            ) : (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                Die Vorlage erstellt das System einschließlich aller Stufen und Farben. Danach
                kannst du jede Stufe individuell bearbeiten.
              </div>
            )}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button
              loading={create.isPending || update.isPending || createPreset.isPending}
              type="submit"
            >
              {system ? "Speichern" : presetId ? "Vorlage erstellen" : "System erstellen"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
