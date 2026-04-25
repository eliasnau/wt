"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";
import type { Product } from "../../_components/types";
import { StockEditPopover } from "./stock-edit-popover";

type Variant = Product["variants"][number];

const MAX_QUANTITY = 999_999;

export function VariantStockRow({
  variant,
  productId,
  showLabel = true,
}: {
  variant: Variant;
  productId: string;
  /** Whether to render the variant option label on the left side. */
  showLabel?: boolean;
}) {
  const queryClient = useQueryClient();
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const stepMutation = useMutation({
    mutationFn: async (next: number) =>
      client.inventory.updateVariantQuantity({
        variantId: variant.id,
        quantity: next,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.inventory.getProduct.queryKey({
          input: { productId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.inventory.listProducts.key(),
      });
      setSavedFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setSavedFlash(false), 1200);
    },
    onError: (error) => {
      toast.error(error.message || "Bestand konnte nicht aktualisiert werden");
    },
  });

  function commitDelta(delta: number) {
    const next = Math.max(
      0,
      Math.min(MAX_QUANTITY, Math.floor(variant.quantity + delta)),
    );
    if (next === variant.quantity) return;
    stepMutation.mutate(next);
  }

  const optionLabel =
    variant.options.length > 0
      ? variant.options.map((o) => o.value).join(" · ")
      : null;

  const isBusy = stepMutation.isPending;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5 transition-colors",
        savedFlash && "bg-emerald-500/[0.06]",
      )}
    >
      {showLabel && optionLabel && (
        <div className="min-w-0 flex-1">
          <span className="truncate font-medium text-sm">{optionLabel}</span>
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-2",
          !optionLabel || !showLabel ? "w-full justify-between" : "ml-auto",
        )}
      >
        <StockEditPopover
          variantId={variant.id}
          productId={productId}
          currentQuantity={variant.quantity}
          variantLabel={optionLabel}
          trigger={
            <button
              type="button"
              aria-label={`Bestand bearbeiten${
                optionLabel ? ` für ${optionLabel}` : ""
              }`}
              className="group inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 transition-colors hover:border-input hover:bg-accent/50 focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "font-semibold text-base tabular-nums",
                  variant.quantity === 0 && "text-muted-foreground/60",
                )}
              >
                {variant.quantity}
              </span>
              <span className="font-normal text-muted-foreground/70 text-xs">
                Stk.
              </span>
              {savedFlash ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
              )}
            </button>
          }
        />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="−1"
            disabled={isBusy || variant.quantity <= 0}
            onClick={() => commitDelta(-1)}
          >
            {isBusy ? (
              <Spinner className="size-3" />
            ) : (
              <Minus className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="+1"
            disabled={isBusy || variant.quantity >= MAX_QUANTITY}
            onClick={() => commitDelta(1)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
