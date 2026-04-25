"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverClose,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

const MAX_QUANTITY = 999_999;

type Mode = "set" | "add" | "sub";

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
  { value: "set", label: "Setzen" },
  { value: "add", label: "Hinzufügen" },
  { value: "sub", label: "Abziehen" },
];

function computeNext(current: number, mode: Mode, value: number): number {
  if (mode === "set") return Math.max(0, Math.min(MAX_QUANTITY, value));
  if (mode === "add") return Math.min(MAX_QUANTITY, current + value);
  return Math.max(0, current - value);
}

export function StockEditPopover({
  trigger,
  currentQuantity,
  variantId,
  productId,
  variantLabel,
  align = "end",
}: {
  trigger: React.ReactElement;
  currentQuantity: number;
  variantId: string;
  productId: string;
  variantLabel?: string | null;
  align?: "start" | "center" | "end";
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("set");
  const [amount, setAmount] = useState<string>(String(currentQuantity));

  useEffect(() => {
    if (open) {
      setMode("set");
      setAmount(String(currentQuantity));
    }
  }, [open, currentQuantity]);

  const parsed = Number.parseInt(amount, 10);
  const isValid = !Number.isNaN(parsed) && parsed >= 0;
  const nextQuantity = isValid
    ? computeNext(currentQuantity, mode, parsed)
    : currentQuantity;
  const willChange = isValid && nextQuantity !== currentQuantity;

  const mutation = useMutation({
    mutationFn: async (next: number) =>
      client.inventory.updateVariantQuantity({
        variantId,
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
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Bestand konnte nicht aktualisiert werden");
    },
  });

  function submit() {
    if (!willChange || mutation.isPending) return;
    mutation.mutate(nextQuantity);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverPopup side="bottom" align={align} className="w-72">
        <div className="flex flex-col gap-3">
          {variantLabel && (
            <div className="truncate font-medium text-sm">{variantLabel}</div>
          )}

          <div className="flex rounded-md bg-muted p-0.5">
            {MODE_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setMode(opt.value);
                    setAmount(opt.value === "set" ? String(currentQuantity) : "");
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex-1 rounded-sm px-2 py-1 font-medium text-xs transition-colors",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <Input
            // biome-ignore lint/a11y/noAutofocus: popover opens via user click
            autoFocus
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_QUANTITY}
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            className="text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />

          <div className="flex items-center justify-between text-sm tabular-nums">
            <span className="text-muted-foreground text-xs">Neuer Bestand</span>
            <span
              className={cn(
                "font-semibold",
                willChange ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {nextQuantity}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <PopoverClose
              render={<Button type="button" variant="ghost" size="sm" />}
              disabled={mutation.isPending}
            >
              Abbrechen
            </PopoverClose>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!willChange || mutation.isPending}
            >
              {mutation.isPending ? <Spinner /> : <Check className="size-4" />}
              Speichern
            </Button>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
