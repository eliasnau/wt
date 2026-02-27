"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

interface CancelMemberDialogProps {
  memberId: string;
  memberName: string;
  initialPeriodEndDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function getNextMonthValue(reference = new Date()): string {
  const next = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseMonthValue(
  value: string,
): { year: number; month: number } | null {
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

function getMonthValueForDate(dateValue: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

function getMonthEndDateForValue(monthValue: string): string | null {
  const parsed = parseMonthValue(monthValue);
  if (!parsed) return null;
  const day = String(getDaysInMonth(parsed.year, parsed.month)).padStart(
    2,
    "0",
  );
  return `${String(parsed.year).padStart(4, "0")}-${String(parsed.month).padStart(2, "0")}-${day}`;
}

function monthValueToIndex(value: string): number | null {
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!year || !month) return null;
  return year * 12 + month;
}

function getMinimumAllowedMonth(initialPeriodEndDate?: string | null): string {
  const nextMonth = getNextMonthValue();
  if (!initialPeriodEndDate) return nextMonth;

  const initialEndMonth = getMonthValueForDate(initialPeriodEndDate);
  if (!initialEndMonth) return nextMonth;

  const nextIndex = monthValueToIndex(nextMonth);
  const initialIndex = monthValueToIndex(initialEndMonth);

  if (nextIndex === null || initialIndex === null) return nextMonth;
  return initialIndex > nextIndex ? initialEndMonth : nextMonth;
}

function formatEffectiveDate(monthValue: string): string {
  if (!monthValue) return "der ausgewählte Monat";
  const parsed = parseMonthValue(monthValue);
  if (!parsed) return "der ausgewählte Monat";
  return new Date(
    parsed.year,
    parsed.month - 1,
    getDaysInMonth(parsed.year, parsed.month),
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateLabel(dateValue?: string | null): string | null {
  if (!dateValue) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isMonthAtOrAfter(monthValue: string, minMonth: string): boolean {
  if (!monthValue) return false;
  const currentIndex = monthValueToIndex(monthValue);
  const minIndex = monthValueToIndex(minMonth);
  if (currentIndex === null || minIndex === null) return false;
  return currentIndex >= minIndex;
}

export function CancelMemberDialog({
  memberId,
  memberName,
  initialPeriodEndDate,
  open,
  onOpenChange,
  onSuccess,
}: CancelMemberDialogProps) {
  const queryClient = useQueryClient();
  const minMonth = useMemo(
    () => getMinimumAllowedMonth(initialPeriodEndDate),
    [initialPeriodEndDate],
  );
  const commitmentEndLabel = useMemo(
    () => formatDateLabel(initialPeriodEndDate),
    [initialPeriodEndDate],
  );
  const [effectiveMonth, setEffectiveMonth] = useState(() => minMonth);
  const [cancelReason, setCancelReason] = useState("");
  const [monthError, setMonthError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const cancelMutation = useMutation(
    orpc.members.cancelContract.mutationOptions({
      onSuccess: () => {
        toast.success("Mitgliedschaft gekündigt", {
          description: `${memberName} will stay active until ${formatEffectiveDate(effectiveMonth)}.`,
        });
        queryClient.invalidateQueries();
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Mitgliedschaft konnte nicht gekündigt werden",
        );
      },
    }),
  );

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevMinMonth, setPrevMinMonth] = useState(minMonth);

  if (open !== prevOpen || minMonth !== prevMinMonth) {
    setPrevOpen(open);
    setPrevMinMonth(minMonth);
    setEffectiveMonth(minMonth);
    setMonthError(null);
    setReasonError(null);
    if (!open) {
      setCancelReason("");
    }
  }

  useEffect(() => {
    if (!open) {
      cancelMutation.reset();
    }
  }, [open, cancelMutation]);

  const handleSubmit = () => {
    const trimmedReason = cancelReason.trim();
    const hasValidMonth = isMonthAtOrAfter(effectiveMonth, minMonth);

    setMonthError(
      !effectiveMonth
        ? "Wähle einen Wirksamkeitsmonat."
        : !hasValidMonth
          ? "Der Wirksamkeitsmonat muss nach dem aktuellen Bindungszeitraum liegen."
          : null,
    );
    setReasonError(!trimmedReason ? "Kündigungsgrund ist erforderlich." : null);

    if (!trimmedReason || !hasValidMonth) {
      return;
    }

    const contractEndDate = getMonthEndDateForValue(effectiveMonth);
    if (!contractEndDate) {
      setMonthError("Wähle einen gültigen Wirksamkeitsmonat.");
      return;
    }

    cancelMutation.mutate({
      memberId,
      cancelReason: trimmedReason,
      cancellationEffectiveDate: contractEndDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mitgliedschaft kündigen</DialogTitle>
          <DialogDescription>
            Set the cancellation effective month and provide a reason for this
            member.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>Zeitpunkt der Kündigung</AlertTitle>
            <AlertDescription>
              {commitmentEndLabel && (
                <span>
                  Commitment ends on <strong>{commitmentEndLabel}</strong>.{" "}
                </span>
              )}
              The member will remain active and billable through{" "}
              <strong>{formatEffectiveDate(effectiveMonth)}</strong>. After
              that, they will be excluded from future payment batches.
            </AlertDescription>
          </Alert>

          <Field>
            <FieldLabel htmlFor="cancel-effective-month">
              Wirksamkeitsmonat
            </FieldLabel>
            <Input
              id="cancel-effective-month"
              type="month"
              min={minMonth}
              value={effectiveMonth}
              onChange={(event) => {
                setEffectiveMonth(event.target.value);
                setMonthError(null);
              }}
            />
            <FieldDescription>
              Contract ends on the last day of the selected month. Earliest
              allowed end date: {formatEffectiveDate(minMonth)}.
            </FieldDescription>
            {monthError && <FieldError errors={[{ message: monthError }]} />}
          </Field>

          <Field>
            <FieldLabel htmlFor="cancel-reason">Grund</FieldLabel>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value);
                setReasonError(null);
              }}
              maxLength={1000}
              rows={4}
              placeholder="Warum wird diese Mitgliedschaft gekündigt?"
            />
            <FieldDescription>
              This will be stored on the contract for audit and reporting.
            </FieldDescription>
            {reasonError && <FieldError errors={[{ message: reasonError }]} />}
          </Field>
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Membership
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending
              ? "Kündigung läuft..."
              : "Mitgliedschaft kündigen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
