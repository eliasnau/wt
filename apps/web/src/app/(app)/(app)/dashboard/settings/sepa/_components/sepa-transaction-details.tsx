"use client";

import { CircleQuestionMarkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SepaTransactionFormState = {
  membershipTemplate: string;
  joiningFeeTemplate: string;
  yearlyFeeTemplate: string;
};

type SepaTransactionDetailsProps = {
  formState: SepaTransactionFormState;
  setFormState: React.Dispatch<React.SetStateAction<SepaTransactionFormState>>;
  isLoading: boolean;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  docsHref?: string;
};

export function SepaTransactionDetails({
  formState,
  setFormState,
  isLoading,
  isSaving,
  onSubmit,
  docsHref,
}: SepaTransactionDetailsProps) {
  return (
    <Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
      <FramePanel>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-heading text-foreground text-xl">
            Transaction Details
          </h2>
          {docsHref ? (
            <Button
              size="xs"
              variant="outline"
              render={
                <a href={docsHref} target="_blank" rel="noreferrer noopener" />
              }
            >
              <CircleQuestionMarkIcon data-icon="inline-start" />
              Docs
            </Button>
          ) : null}
        </div>
        <p className="mb-6 text-muted-foreground text-sm">
          Customize how transactions appear on bank statements
        </p>
        <form
          id="sepa-transaction-form"
          onSubmit={onSubmit}
          className="space-y-6"
        >
          <TransactionTemplateFields
            formState={formState}
            setFormState={setFormState}
            isLoading={isLoading}
          />
        </form>
      </FramePanel>
      <FrameFooter>
        <Button
          type="submit"
          form="sepa-transaction-form"
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Speichern..." : "Änderungen speichern"}
        </Button>
        <VariablesTooltip />
      </FrameFooter>
    </Frame>
  );
}

function TransactionTemplateFields({
  formState,
  setFormState,
  isLoading,
}: {
  formState: SepaTransactionFormState;
  setFormState: React.Dispatch<React.SetStateAction<SepaTransactionFormState>>;
  isLoading: boolean;
}) {
  return (
    <>
      <Field>
        <FieldLabel>Monatsbeitrag</FieldLabel>
        <Input
          placeholder={
            isLoading
              ? "Lädt..."
              : "Monatlicher Mitgliedsbeitrag für %MONTH% %YEAR%"
          }
          type="text"
          maxLength={140}
          value={isLoading ? "" : formState.membershipTemplate}
          disabled={isLoading}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              membershipTemplate: e.target.value,
            }))
          }
        />
        <p className="mt-1 text-muted-foreground text-xs">
          Description for recurring monthly payments
        </p>
      </Field>

      <Field>
        <FieldLabel>Aufnahmegebühr</FieldLabel>
        <Input
          placeholder={isLoading ? "Lädt..." : "Einmalige Aufnahmegebühr"}
          type="text"
          maxLength={140}
          value={isLoading ? "" : formState.joiningFeeTemplate}
          disabled={isLoading}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              joiningFeeTemplate: e.target.value,
            }))
          }
        />
        <p className="mt-1 text-muted-foreground text-xs">
          Description for the initial joining fee charged when a member
          registers
        </p>
      </Field>

      <Field>
        <FieldLabel>Jahresbeitrag</FieldLabel>
        <Input
          placeholder={
            isLoading ? "Lädt..." : "Annual membership fee for %YEAR%"
          }
          type="text"
          maxLength={140}
          value={isLoading ? "" : formState.yearlyFeeTemplate}
          disabled={isLoading}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              yearlyFeeTemplate: e.target.value,
            }))
          }
        />
        <p className="mt-1 text-muted-foreground text-xs">
          Description for the annual membership payment
        </p>
      </Field>
    </>
  );
}

function VariablesTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex w-fit cursor-help items-center gap-2 text-muted-foreground text-sm">
            <Info className="size-4" />
            <span>Verfügbare Variablen</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="top" align="start">
          <p className="text-sm">
            <strong>%MONTH%</strong> - Month name (e.g., January)
            <br />
            <strong>%YEAR%</strong> - Year (e.g., 2025)
            <br />
            <strong>%MEMBER_NAME%</strong> - Member&apos;s full name
            <br />
            <strong>%MEMBER_ID%</strong> - Member ID number
            <br />
            <strong>%JOIN_DATE%</strong> - Date of joining
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
