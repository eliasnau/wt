"use client";

import { CircleQuestionMarkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
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
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Transaktionsdetails</CardFrameTitle>
        <CardFrameDescription>
          Konfiguriere, wie Transaktionen auf Kontoauszügen erscheinen
        </CardFrameDescription>
        {docsHref ? (
          <CardFrameAction>
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
          </CardFrameAction>
        ) : null}
      </CardFrameHeader>
      <Card>
        <CardPanel>
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
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || isLoading}
              >
                {isSaving ? "Speichern..." : "Änderungen speichern"}
              </Button>
            </div>
          </form>
        </CardPanel>
      </Card>
      <CardFrameFooter>
        <VariablesTooltip />
      </CardFrameFooter>
    </CardFrame>
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
          Beschreibung für wiederkehrende monatliche Zahlungen
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
          Beschreibung für die einmalige Aufnahmegebühr bei der Registrierung
        </p>
      </Field>

      <Field>
        <FieldLabel>Jahresbeitrag</FieldLabel>
        <Input
          placeholder={
            isLoading ? "Lädt..." : "Jährlicher Mitgliedsbeitrag für %YEAR%"
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
          Beschreibung für die jährliche Mitgliedszahlung
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
          <div className="flex w-fit cursor-help items-center gap-2 text-muted-foreground text-xs">
            <Info className="size-3 h-lh shrink-0" />
            <span>Verfügbare Variablen</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="top" align="start">
          <p className="text-sm">
            <strong>%MONTH%</strong> – Monatsname (z. B. Januar)
            <br />
            <strong>%YEAR%</strong> – Jahr (z. B. 2025)
            <br />
            <strong>%MEMBER_NAME%</strong> – Vollständiger Name des Mitglieds
            <br />
            <strong>%MEMBER_ID%</strong> – Mitgliedsnummer
            <br />
            <strong>%JOIN_DATE%</strong> – Beitrittsdatum
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
