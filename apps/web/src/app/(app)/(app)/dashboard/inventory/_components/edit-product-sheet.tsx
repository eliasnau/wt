"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/utils/orpc";
import { AttributeEditor } from "./attribute-editor";
import {
  type EditableAttribute,
  type Product,
  toEditableAttributes,
  toProductDefinition,
} from "./types";

export function EditProductDetailsSheet({
  product,
}: {
  product: Product;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [attributes, setAttributes] = useState<EditableAttribute[]>(
    toEditableAttributes(product.attributes),
  );

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(product.name);
      setDescription(product.description ?? "");
      setAttributes(toEditableAttributes(product.attributes));
    }
    setOpen(nextOpen);
  }

  const updateProductMutation = useMutation({
    mutationFn: async () => {
      return client.inventory.updateProduct({
        productId: product.id,
        name: name.trim(),
        description: description.trim() || undefined,
        attributes: toProductDefinition(attributes),
      });
    },
    onSuccess: () => {
      toast.success("Produkt gespeichert");
      setOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Produkt konnte nicht gespeichert werden");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return client.inventory.deleteProduct({ productId: product.id });
    },
    onSuccess: () => {
      toast.success("Produkt gelöscht");
      setOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Produkt konnte nicht gelöscht werden");
    },
  });

  const isBusy =
    updateProductMutation.isPending || deleteProductMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-4" />
        Produkt bearbeiten
      </SheetTrigger>
      <SheetPopup inset>
        <SheetHeader>
          <SheetTitle>{product.name} bearbeiten</SheetTitle>
          <SheetDescription>
            Name, Beschreibung und Attribute des Produkts anpassen.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-6">
          <div className="space-y-4">
            <div className="font-medium text-sm">Produktdetails</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor={`edit-name-${product.id}`}
                  className="text-muted-foreground text-xs"
                >
                  Produktname
                </label>
                <Input
                  id={`edit-name-${product.id}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isBusy}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor={`edit-desc-${product.id}`}
                  className="text-muted-foreground text-xs"
                >
                  Beschreibung
                </label>
                <Input
                  id={`edit-desc-${product.id}`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={isBusy}
                  placeholder="Optionale Beschreibung"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          <AttributeEditor
            attributes={attributes}
            onChange={setAttributes}
            disabled={isBusy}
            idPrefix={`edit-${product.id}`}
          />
        </SheetPanel>
        <SheetFooter>
          <Button
            variant="destructive-outline"
            size="sm"
            disabled={isBusy}
            onClick={() => {
              if (!confirm("Produkt wirklich löschen?")) return;
              deleteProductMutation.mutate();
            }}
          >
            <Trash2 className="size-4" />
            Löschen
          </Button>
          <div className="flex-1" />
          <SheetClose render={<Button variant="ghost" />} disabled={isBusy}>
            Abbrechen
          </SheetClose>
          <Button
            onClick={() => updateProductMutation.mutate()}
            disabled={isBusy || !name.trim()}
          >
            {updateProductMutation.isPending ? (
              <Spinner />
            ) : (
              <Save className="size-4" />
            )}
            Speichern
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
