"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { TableCell, TableRow } from "@/components/ui/table";
import { client } from "@/utils/orpc";
import { EditProductDetailsSheet } from "./edit-product-sheet";
import { type Product, getTotalStock } from "./types";
import { VariantQuickEdit } from "./variant-quick-edit";

export function ProductStockSheet({
  product,
}: {
  product: Product;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(
    {},
  );
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedValues({});
      setActiveVariantId(null);
    }
    setOpen(nextOpen);
  }

  const updateVariantMutation = useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      return client.inventory.updateVariantQuantity({ variantId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Bestand konnte nicht aktualisiert werden");
    },
  });

  const filteredVariants = useMemo(() => {
    const entries = Object.entries(selectedValues);
    if (entries.length === 0) return product.variants;
    return product.variants.filter((variant) =>
      entries.every(([attrName, value]) =>
        variant.options.some(
          (opt) => opt.attributeName === attrName && opt.value === value,
        ),
      ),
    );
  }, [product.variants, selectedValues]);

  function handleQuickSave(variantId: string, quantity: number) {
    updateVariantMutation.mutate(
      { variantId, quantity },
      {
        onSuccess: () => {
          toast.success("Bestand aktualisiert");
          setActiveVariantId(null);
        },
      },
    );
  }

  const isBusy = updateVariantMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger nativeButton={false} render={<TableRow className="group cursor-pointer" />}>
        <TableCell>
          <div className="font-medium">{product.name}</div>
          {product.description && (
            <p className="mt-0.5 truncate text-muted-foreground text-sm">
              {product.description}
            </p>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.attributes.map((attr) => (
              <Badge key={attr.id} variant="secondary" size="sm">
                {attr.name}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {getTotalStock(product)}
        </TableCell>
        <TableCell className="w-8 pr-4">
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </TableCell>
      </SheetTrigger>
      <SheetPopup inset>
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
          {product.description && (
            <SheetDescription>{product.description}</SheetDescription>
          )}
        </SheetHeader>
        <SheetPanel className="space-y-5">
          {product.attributes.length > 0 && (
            <div className="space-y-3">
              {product.attributes.map((attr) => (
                <div key={attr.id} className="space-y-2">
                  <div className="font-medium text-sm">{attr.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {attr.values.map((val) => {
                      const isSelected = selectedValues[attr.name] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setSelectedValues((prev) => {
                              const next = { ...prev };
                              if (isSelected) delete next[attr.name];
                              else next[attr.name] = val;
                              return next;
                            })
                          }
                          className={`rounded-full border px-3.5 py-1.5 font-medium text-sm transition-colors ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {product.variants.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-center text-muted-foreground text-sm">
              Keine Varianten vorhanden. Bearbeite das Produkt und füge
              Attribute hinzu, um Varianten zu erzeugen.
            </div>
          ) : (
            <div className="space-y-2">
              {product.attributes.length > 0 &&
                Object.keys(selectedValues).length > 0 && (
                  <div className="text-muted-foreground text-xs">
                    {filteredVariants.length} von {product.variants.length}{" "}
                    Varianten
                  </div>
                )}
              <div className="overflow-hidden rounded-xl border">
                {filteredVariants.map((variant, i) => (
                  <div key={variant.id}>
                    {i > 0 && <div className="h-px bg-border" />}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveVariantId(
                          activeVariantId === variant.id ? null : variant.id,
                        )
                      }
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        activeVariantId === variant.id
                          ? "bg-muted/30"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                        {variant.options.length > 0 ? (
                          variant.options.map((opt) => (
                            <span
                              key={opt.attributeName}
                              className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                              {opt.value}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm">Standard</span>
                        )}
                      </div>
                      <span className="font-semibold tabular-nums text-sm">
                        {variant.quantity}
                      </span>
                    </button>
                    {activeVariantId === variant.id && (
                      <div className="border-t px-4 py-3">
                        <VariantQuickEdit
                          variant={variant}
                          isBusy={isBusy}
                          onSave={handleQuickSave}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right text-muted-foreground text-xs tabular-nums">
                {getTotalStock(product)} Stk. gesamt
              </div>
            </div>
          )}
        </SheetPanel>
        <SheetFooter>
          <EditProductDetailsSheet product={product} />
          <div className="flex-1" />
          <SheetClose render={<Button variant="ghost" />} disabled={isBusy}>
            Schließen
          </SheetClose>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
