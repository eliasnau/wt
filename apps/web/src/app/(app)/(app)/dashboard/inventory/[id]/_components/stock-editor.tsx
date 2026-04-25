"use client";

import { LayoutGrid, List, Package } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  applySortMode,
  type Product,
  SORT_OPTIONS,
  type SortMode,
  sortVariants,
} from "../../_components/types";
import { StockMatrix } from "./stock-matrix";
import { VariantStockRow } from "./variant-stock-row";

type Variant = Product["variants"][number];

const NO_GROUPING = "__none__";

export function StockEditor({ product }: { product: Product }) {
  const hasMatrix = product.attributes.length === 2;

  if (product.variants.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>Keine Varianten</EmptyTitle>
          <EmptyDescription>
            Füge Attribute hinzu, um Varianten zu erzeugen — oder bearbeite die
            Standard-Variante.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // No attributes — single default variant. No tabs, no filters.
  if (product.attributes.length === 0) {
    const variant = product.variants[0];
    if (!variant) return null;
    return (
      <div className="overflow-hidden rounded-xl border">
        <VariantStockRow
          variant={variant}
          productId={product.id}
          showLabel={false}
        />
      </div>
    );
  }

  // No matrix view — just the list.
  if (!hasMatrix) {
    return <VariantList product={product} />;
  }

  return (
    <Tabs defaultValue="matrix" className="flex flex-col gap-4">
      <TabsList className="self-start">
        <TabsTrigger value="matrix">
          <LayoutGrid />
          Matrix
        </TabsTrigger>
        <TabsTrigger value="list">
          <List />
          Liste
        </TabsTrigger>
      </TabsList>
      <TabsContent value="matrix">
        <StockMatrix product={product} />
      </TabsContent>
      <TabsContent value="list">
        <VariantList product={product} />
      </TabsContent>
    </Tabs>
  );
}

function VariantList({ product }: { product: Product }) {
  // Per-attribute multi-select filter. Empty set for an attribute = no
  // restriction. Across attributes: AND. Within an attribute: OR.
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  // Which attribute to group by — defaults to no grouping.
  const [groupBy, setGroupBy] = useState<string>(NO_GROUPING);
  // Sort applied within each group.
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const sorted = useMemo(
    () => sortVariants(product.variants, product.attributes),
    [product.variants, product.attributes],
  );

  const filtered = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(
      ([, set]) => set.size > 0,
    );
    if (activeFilters.length === 0) return sorted;
    return sorted.filter((variant) =>
      activeFilters.every(([attrName, set]) => {
        const opt = variant.options.find((o) => o.attributeName === attrName);
        return opt ? set.has(opt.value) : false;
      }),
    );
  }, [sorted, filters]);

  function toggleValue(attrName: string, value: string) {
    setFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[attrName] ?? []);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      next[attrName] = set;
      return next;
    });
  }

  function clearAll() {
    setFilters({});
  }

  const hasAnyFilter = Object.values(filters).some((s) => s.size > 0);

  const groupItems = useMemo(
    () => [
      { value: NO_GROUPING, label: "Keine" },
      ...product.attributes.map((attr) => ({
        value: attr.name,
        label: attr.name,
      })),
    ],
    [product.attributes],
  );

  const groups = useMemo(() => {
    if (groupBy === NO_GROUPING) {
      return [
        {
          key: "__all__",
          label: null,
          variants: applySortMode(filtered, sortMode),
        },
      ];
    }
    const groupAttr = product.attributes.find((a) => a.name === groupBy);
    if (!groupAttr) {
      return [
        {
          key: "__all__",
          label: null,
          variants: applySortMode(filtered, sortMode),
        },
      ];
    }

    const grouped = new Map<string, Variant[]>();
    for (const variant of filtered) {
      const opt = variant.options.find(
        (o) => o.attributeName === groupAttr.name,
      );
      const key = opt?.value ?? "—";
      const list = grouped.get(key) ?? [];
      list.push(variant);
      grouped.set(key, list);
    }
    return groupAttr.values
      .filter((value) => grouped.has(value))
      .map((value) => ({
        key: value,
        label: { attribute: groupAttr.name, value },
        variants: applySortMode(grouped.get(value) ?? [], sortMode),
      }));
  }, [filtered, groupBy, sortMode, product.attributes]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: filter pills (left) + grouping control (right) */}
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-1.5">
          {product.attributes.map((attr) => {
            const selected = filters[attr.name] ?? new Set<string>();
            return (
              <div
                key={attr.id}
                className="flex flex-wrap items-center gap-1.5"
              >
                <span className="me-1 min-w-14 font-medium text-muted-foreground text-xs">
                  {attr.name}
                </span>
                {attr.values.map((value) => {
                  const isSelected = selected.has(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleValue(attr.name, value)}
                      className={cn(
                        "inline-flex h-7 cursor-pointer select-none items-center rounded-full border px-3 text-xs transition-colors",
                        isSelected
                          ? "border-primary/40 bg-primary/10 font-medium text-primary"
                          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col items-end gap-2">
          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="whitespace-nowrap text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline"
            >
              Zurücksetzen
            </button>
          )}
          <label className="flex items-center gap-2">
            <span className="w-20 whitespace-nowrap text-muted-foreground text-xs">
              Gruppieren
            </span>
            <Select
              items={groupItems}
              value={groupBy}
              onValueChange={(value) => setGroupBy(value ?? NO_GROUPING)}
            >
              <SelectTrigger size="sm" className="h-8 min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex items-center gap-2">
            <span className="w-20 whitespace-nowrap text-muted-foreground text-xs">
              Sortieren
            </span>
            <Select
              items={SORT_OPTIONS}
              value={sortMode}
              onValueChange={(value) =>
                setSortMode((value as SortMode | null) ?? "default")
              }
            >
              <SelectTrigger size="sm" className="h-8 min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>Keine Treffer</EmptyTitle>
            <EmptyDescription>
              {hasAnyFilter
                ? "Keine Variante passt zu den ausgewählten Filtern."
                : "Keine Varianten vorhanden."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-background">
          {groups.map((group, groupIdx) => (
            <div key={group.key}>
              {group.label && (
                <div
                  className={cn(
                    "flex items-baseline gap-2 bg-muted/30 px-4 py-2",
                    groupIdx > 0 && "border-t",
                  )}
                >
                  <span className="font-medium text-muted-foreground text-xs">
                    {group.label.attribute}
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {group.label.value}
                  </span>
                  <span className="ms-auto text-muted-foreground/70 text-xs tabular-nums">
                    {group.variants.length}
                  </span>
                </div>
              )}
              <div className="divide-y">
                {group.variants.map((variant) => (
                  <VariantStockRow
                    key={variant.id}
                    variant={variant}
                    productId={product.id}
                    showLabel
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
