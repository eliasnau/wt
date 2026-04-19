"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus } from "lucide-react";
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
import { type EditableAttribute, toProductDefinition } from "./types";

export function NewProductSheet() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductAttributes, setNewProductAttributes] = useState<
    EditableAttribute[]
  >([]);

  const createProductMutation = useMutation({
    mutationFn: async () => {
      return client.inventory.createProduct({
        name: newProductName.trim(),
        description: newProductDescription.trim() || undefined,
        attributes: toProductDefinition(newProductAttributes),
      });
    },
    onSuccess: () => {
      toast.success("Produkt erstellt");
      setNewProductName("");
      setNewProductDescription("");
      setNewProductAttributes([]);
      setOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Produkt konnte nicht erstellt werden");
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <Plus className="size-4" />
        Neues Produkt
      </SheetTrigger>
      <SheetPopup inset>
        <SheetHeader>
          <SheetTitle>Neues Produkt</SheetTitle>
          <SheetDescription>
            Erstelle ein Produkt und pflege Attribute/Werte direkt im Editor.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="new-product-name"
                className="text-muted-foreground text-xs"
              >
                Produktname
              </label>
              <Input
                id="new-product-name"
                value={newProductName}
                onChange={(event) => setNewProductName(event.target.value)}
                placeholder="z. B. Training T-Shirt"
                disabled={createProductMutation.isPending}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="new-product-description"
                className="text-muted-foreground text-xs"
              >
                Beschreibung
              </label>
              <Input
                id="new-product-description"
                value={newProductDescription}
                onChange={(event) =>
                  setNewProductDescription(event.target.value)
                }
                placeholder="Optionale Beschreibung"
                disabled={createProductMutation.isPending}
              />
            </div>
          </div>

          <AttributeEditor
            attributes={newProductAttributes}
            onChange={setNewProductAttributes}
            disabled={createProductMutation.isPending}
            idPrefix="new-product"
          />
        </SheetPanel>
        <SheetFooter>
          <SheetClose
            render={<Button variant="ghost" />}
            disabled={createProductMutation.isPending}
          >
            Abbrechen
          </SheetClose>
          <Button
            onClick={() => createProductMutation.mutate()}
            disabled={createProductMutation.isPending || !newProductName.trim()}
          >
            {createProductMutation.isPending ? (
              <Spinner />
            ) : (
              <Package className="size-4" />
            )}
            Produkt anlegen
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
