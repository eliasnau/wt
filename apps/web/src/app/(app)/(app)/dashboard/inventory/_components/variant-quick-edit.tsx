"use client";

import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Product } from "./types";

type StockMode = "set" | "add" | "subtract";

export function VariantQuickEdit({
  variant,
  isBusy,
  onSave,
}: {
  variant: Product["variants"][number];
  isBusy: boolean;
  onSave: (variantId: string, quantity: number) => void;
}) {
  const [mode, setMode] = useState<StockMode>("add");
  const [amount, setAmount] = useState("");

  function handleSave() {
    const parsed = Number.parseInt(amount, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Bitte eine gültige Zahl eingeben");
      return;
    }
    let next: number;
    if (mode === "set") {
      next = parsed;
    } else if (mode === "add") {
      next = variant.quantity + parsed;
    } else {
      next = Math.max(0, variant.quantity - parsed);
    }
    onSave(variant.id, next);
    setAmount("");
  }

  const preview = useMemo(() => {
    const parsed = Number.parseInt(amount, 10);
    if (!amount || Number.isNaN(parsed) || parsed < 0) return null;
    if (mode === "set") return parsed;
    if (mode === "add") return variant.quantity + parsed;
    return Math.max(0, variant.quantity - parsed);
  }, [amount, mode, variant.quantity]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border bg-background p-1">
        {(
          [
            { value: "add", label: "Hinzufügen" },
            { value: "subtract", label: "Abziehen" },
            { value: "set", label: "Setzen" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setMode(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium text-xs transition-colors ${
              mode === opt.value
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground text-sm">
            {mode === "set" ? "=" : mode === "add" ? "+" : "\u2212"}
          </span>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="pl-8 text-right tabular-nums"
            disabled={isBusy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && amount) handleSave();
            }}
          />
        </div>
        <Button
          size="default"
          disabled={isBusy || !amount}
          onClick={handleSave}
        >
          {isBusy ? <Spinner /> : <Save className="size-4" />}
        </Button>
      </div>

      {preview !== null && (
        <div className="text-right text-xs tabular-nums text-muted-foreground">
          {variant.quantity} &rarr;{" "}
          <span className="font-semibold text-foreground">{preview}</span>
        </div>
      )}
    </div>
  );
}
