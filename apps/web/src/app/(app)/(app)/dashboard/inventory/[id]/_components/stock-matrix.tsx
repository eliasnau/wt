"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "../../_components/types";
import { StockEditPopover } from "./stock-edit-popover";

type Variant = Product["variants"][number];

function buildVariantLookup(variants: Variant[]) {
  const map = new Map<string, Variant>();
  for (const variant of variants) {
    const key = variant.options
      .map((o) => `${o.attributeName}=${o.value}`)
      .sort()
      .join("|");
    map.set(key, variant);
  }
  return map;
}

function variantKey(
  rowAttr: string,
  rowValue: string,
  colAttr: string,
  colValue: string,
) {
  return [`${rowAttr}=${rowValue}`, `${colAttr}=${colValue}`].sort().join("|");
}

export function StockMatrix({ product }: { product: Product }) {
  const lookup = useMemo(
    () => buildVariantLookup(product.variants),
    [product.variants],
  );

  if (product.attributes.length !== 2) return null;

  const [rowAttr, colAttr] = product.attributes;
  if (!rowAttr || !colAttr) return null;

  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground text-xs">
              <span className="text-foreground">{rowAttr.name}</span>
              <span className="px-1 text-muted-foreground">/</span>
              <span className="text-foreground">{colAttr.name}</span>
            </th>
            {colAttr.values.map((colValue) => (
              <th
                key={colValue}
                className="bg-muted/40 px-2 py-2 text-center font-medium text-foreground text-xs"
              >
                {colValue}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowAttr.values.map((rowValue) => (
            <tr key={rowValue} className="border-t">
              <th
                scope="row"
                className="sticky left-0 z-10 whitespace-nowrap bg-muted/40 px-3 py-1.5 text-left font-medium text-foreground text-xs"
              >
                {rowValue}
              </th>
              {colAttr.values.map((colValue) => {
                const key = variantKey(
                  rowAttr.name,
                  rowValue,
                  colAttr.name,
                  colValue,
                );
                const variant = lookup.get(key);
                return (
                  <td
                    key={colValue}
                    className="border-l px-1.5 py-1.5 text-center"
                  >
                    {variant ? (
                      <MatrixCell
                        variant={variant}
                        productId={product.id}
                        label={`${rowAttr.name}: ${rowValue} · ${colAttr.name}: ${colValue}`}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatrixCell({
  variant,
  productId,
  label,
}: {
  variant: Variant;
  productId: string;
  label: string;
}) {
  const isZero = variant.quantity === 0;
  return (
    <StockEditPopover
      variantId={variant.id}
      productId={productId}
      currentQuantity={variant.quantity}
      variantLabel={label}
      align="center"
      trigger={
        <button
          type="button"
          aria-label={`${label} – Bestand bearbeiten (aktuell ${variant.quantity})`}
          className={cn(
            "inline-flex h-8 w-16 items-center justify-center rounded-md border border-transparent font-semibold text-sm tabular-nums transition-colors hover:border-input hover:bg-accent focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isZero && "text-muted-foreground/60",
          )}
        >
          {variant.quantity}
        </button>
      }
    />
  );
}
