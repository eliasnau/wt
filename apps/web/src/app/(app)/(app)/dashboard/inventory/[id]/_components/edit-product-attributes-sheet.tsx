"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/utils/orpc";
import { AttributeEditor } from "../../_components/attribute-editor";
import {
  type EditableAttribute,
  type Product,
  toEditableAttributes,
  toProductDefinition,
} from "../../_components/types";

function describeAttributeChange(
  before: Product["attributes"],
  after: EditableAttribute[],
): string | null {
  // Best-effort: detect whether existing variants will be wiped or rebuilt.
  if (before.length === 0 && after.length === 0) return null;

  const beforeNames = before.map((a) => a.name.toLowerCase()).sort();
  const afterNames = after
    .map((a) => a.name.trim().toLowerCase())
    .filter((n) => n.length > 0)
    .sort();

  const namesEqual =
    beforeNames.length === afterNames.length &&
    beforeNames.every((name, idx) => name === afterNames[idx]);

  if (!namesEqual) {
    return "Attribut-Struktur ändert sich. Varianten werden neu generiert; Bestände für entfernte Kombinationen gehen verloren.";
  }

  // Compare values per attribute.
  for (const beforeAttr of before) {
    const afterAttr = after.find(
      (a) =>
        a.name.trim().toLowerCase() === beforeAttr.name.toLowerCase(),
    );
    if (!afterAttr) continue;
    const beforeValues = beforeAttr.values
      .map((v) => v.toLowerCase())
      .sort();
    const afterValues = afterAttr.values
      .map((v) => v.value.trim().toLowerCase())
      .filter((v) => v.length > 0)
      .sort();

    const valuesEqual =
      beforeValues.length === afterValues.length &&
      beforeValues.every((value, idx) => value === afterValues[idx]);

    if (!valuesEqual) {
      return "Werte ändern sich. Varianten für entfernte Werte werden gelöscht; neue Varianten starten mit Bestand 0.";
    }
  }

  return null;
}

export function EditProductAttributesSheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [attributes, setAttributes] = useState<EditableAttribute[]>(
    toEditableAttributes(product.attributes),
  );

  useEffect(() => {
    if (!open) return;
    setAttributes(toEditableAttributes(product.attributes));
  }, [open, product.attributes]);

  const warning = useMemo(
    () => describeAttributeChange(product.attributes, attributes),
    [product.attributes, attributes],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      return client.inventory.updateProduct({
        productId: product.id,
        name: product.name,
        description: product.description ?? undefined,
        attributes: toProductDefinition(attributes),
      });
    },
    onSuccess: () => {
      toast.success("Attribute gespeichert");
      onOpenChange(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Attribute konnten nicht gespeichert werden");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup inset>
        <SheetHeader>
          <SheetTitle>Attribute &amp; Varianten</SheetTitle>
          <SheetDescription>
            Pflege Attribute (z.&nbsp;B. Größe, Farbe) und ihre Werte. Varianten
            werden automatisch generiert.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-5">
          <AttributeEditor
            attributes={attributes}
            onChange={setAttributes}
            disabled={mutation.isPending}
            idPrefix={`edit-${product.id}-attrs`}
          />
          {warning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <span>{warning}</span>
            </div>
          )}
        </SheetPanel>
        <SheetFooter>
          <SheetClose
            render={<Button variant="ghost" />}
            disabled={mutation.isPending}
          >
            Abbrechen
          </SheetClose>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Spinner /> : <Save className="size-4" />}
            Speichern
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
