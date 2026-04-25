"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
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
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";
import {
  type Product,
  type ProductDefinition,
} from "../../_components/types";

export function EditProductDetailsSheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");

  useEffect(() => {
    if (!open) return;
    setName(product.name);
    setDescription(product.description ?? "");
  }, [open, product.name, product.description]);

  const mutation = useMutation({
    mutationFn: async () => {
      // Preserve existing attributes — this sheet only edits name/description.
      const attributes: ProductDefinition[] = product.attributes.map(
        (attr) => ({
          name: attr.name,
          values: attr.values,
        }),
      );
      return client.inventory.updateProduct({
        productId: product.id,
        name: name.trim(),
        description: description.trim() || undefined,
        attributes,
      });
    },
    onSuccess: () => {
      toast.success("Produktdetails gespeichert");
      onOpenChange(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Produkt konnte nicht gespeichert werden");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup inset>
        <SheetHeader>
          <SheetTitle>Produktdetails bearbeiten</SheetTitle>
          <SheetDescription>
            Name und Beschreibung des Produkts anpassen.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor={`edit-name-${product.id}`}
              className="font-medium text-sm"
            >
              Produktname
            </label>
            <Input
              id={`edit-name-${product.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={mutation.isPending}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`edit-desc-${product.id}`}
              className="font-medium text-sm"
            >
              Beschreibung
            </label>
            <Textarea
              id={`edit-desc-${product.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={mutation.isPending}
              placeholder="Optionale Beschreibung"
              rows={4}
            />
          </div>
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
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? (
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
