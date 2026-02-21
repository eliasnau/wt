"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleQuestionMarkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";
import {
  Header,
  HeaderContent,
  HeaderDescription,
  HeaderTitle,
} from "../../_components/page-header";
import { SepaTransactionDetails } from "./_components/sepa-transaction-details";

export default function SepaSettingsPage() {
  const transactionDocsUrl =
    "https://docs.matdesk.app/docs/settings/sepa#transaktionsdetails";

  const normalizeBankValue = (value: string) =>
    value.replace(/\s+/g, "").toUpperCase();
  const isValidIban = (value: string) =>
    /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(value);

  const { data, isPending } = useQuery(
    orpc.organizations.getSettings.queryOptions({
      input: {},
    }),
  );

  const [formState, setFormState] = useState({
    creditorName: "",
    creditorIban: "",
    creditorBic: "",
    creditorId: "",
    initiatorName: "",
    batchBooking: true,
    membershipTemplate: "",
    joiningFeeTemplate: "",
    yearlyFeeTemplate: "",
  });

  const [initialState, setInitialState] = useState(formState);
  const isSepaComplete = !!(
    data?.settings?.creditorName &&
    data?.settings?.creditorIban &&
    data?.settings?.creditorBic &&
    data?.settings?.creditorId
  );
  const isLoading = isPending && !data;

  const [prevData, setPrevData] = useState<typeof data | null>(null);

  if (data !== prevData) {
    setPrevData(data);
    if (data) {
      const settings = data.settings;
      const nextState = {
        creditorName: settings?.creditorName ?? "",
        creditorIban: settings?.creditorIban ?? "",
        creditorBic: settings?.creditorBic ?? "",
        creditorId: settings?.creditorId ?? "",
        initiatorName: settings?.initiatorName ?? "",
        batchBooking: settings?.batchBooking ?? true,
        membershipTemplate: settings?.remittanceTemplates?.membership ?? "",
        joiningFeeTemplate: settings?.remittanceTemplates?.joiningFee ?? "",
        yearlyFeeTemplate: settings?.remittanceTemplates?.yearlyFee ?? "",
      };
      setFormState(nextState);
      setInitialState(nextState);
    }
  }

  const updateMutation = useMutation(
    orpc.organizations.updateSettings.mutationOptions({
      onSuccess: (result) => {
        toast.success("SEPA-Einstellungen aktualisiert");
        const settings = result.settings;
        const nextState = {
          creditorName: settings.creditorName ?? "",
          creditorIban: settings.creditorIban ?? "",
          creditorBic: settings.creditorBic ?? "",
          creditorId: settings.creditorId ?? "",
          initiatorName: settings.initiatorName ?? "",
          batchBooking: settings.batchBooking ?? true,
          membershipTemplate: settings.remittanceTemplates?.membership ?? "",
          joiningFeeTemplate: settings.remittanceTemplates?.joiningFee ?? "",
          yearlyFeeTemplate: settings.remittanceTemplates?.yearlyFee ?? "",
        };
        setFormState(nextState);
        setInitialState(nextState);
      },
      onError: (error: any) => {
        toast.error("SEPA-Einstellungen konnten nicht aktualisiert werden", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedIban = formState.creditorIban
      ? normalizeBankValue(formState.creditorIban)
      : "";
    const normalizedBic = formState.creditorBic
      ? normalizeBankValue(formState.creditorBic)
      : "";
    const normalizedCreditorId = formState.creditorId
      ? normalizeBankValue(formState.creditorId)
      : "";

    if (normalizedIban && !isValidIban(normalizedIban)) {
      toast.error("Invalid IBAN", {
        description: "Please enter a valid IBAN before saving.",
      });
      return;
    }

    updateMutation.mutate({
      creditorName: formState.creditorName || undefined,
      creditorIban: normalizedIban || undefined,
      creditorBic: normalizedBic || undefined,
      creditorId: normalizedCreditorId || undefined,
      initiatorName: formState.initiatorName || undefined,
      batchBooking: formState.batchBooking,
      remittanceTemplates: {
        membership: formState.membershipTemplate || undefined,
        joiningFee: formState.joiningFeeTemplate || undefined,
        yearlyFee: formState.yearlyFeeTemplate || undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <Header>
        <HeaderContent>
          <HeaderTitle>SEPA-Zahlungseinstellungen</HeaderTitle>
          <HeaderDescription>
            Configure your SEPA direct debit payment information
          </HeaderDescription>
        </HeaderContent>
      </Header>

      <div className="space-y-6">
        {!isPending && !isSepaComplete ? (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>SEPA-Informationen vervollständigen</AlertTitle>
            <AlertDescription>
              Add creditor name, IBAN, BIC, and creditor ID to enable SEPA
              exports.
            </AlertDescription>
          </Alert>
        ) : null}
        <Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
          <FramePanel>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-heading text-foreground text-xl">
                Bank Account Details
              </h2>
              <Button
                size="xs"
                variant="outline"
                render={
                  <a
                    href={transactionDocsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <CircleQuestionMarkIcon data-icon="inline-start" />
                Docs
              </Button>
            </div>
            <p className="mb-6 text-muted-foreground text-sm">
              Enter your bank account information for SEPA direct debit
            </p>
            <form
              id="sepa-bank-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Field>
                <FieldLabel>Gläubigername</FieldLabel>
                <Input
                  placeholder={isLoading ? "Lädt..." : "Beispiel GmbH"}
                  type="text"
                  value={isLoading ? "" : formState.creditorName}
                  disabled={isLoading}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      creditorName: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>IBAN</FieldLabel>
                <Input
                  placeholder={isLoading ? "Lädt..." : "DE89370400440532013000"}
                  type="text"
                  maxLength={34}
                  value={isLoading ? "" : formState.creditorIban}
                  disabled={isLoading}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      creditorIban: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>BIC</FieldLabel>
                <Input
                  placeholder={isLoading ? "Lädt..." : "COBADEFFXXX"}
                  type="text"
                  maxLength={11}
                  value={isLoading ? "" : formState.creditorBic}
                  disabled={isLoading}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      creditorBic: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Gläubiger-ID</FieldLabel>
                <Input
                  placeholder={isLoading ? "Lädt..." : "DE98ZZZ09999999999"}
                  type="text"
                  value={isLoading ? "" : formState.creditorId}
                  disabled={isLoading}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      creditorId: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Name des Initiators (optional)</FieldLabel>
                <Input
                  placeholder={isLoading ? "Lädt..." : "Beispiel GmbH"}
                  type="text"
                  value={isLoading ? "" : formState.initiatorName}
                  disabled={isLoading}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      initiatorName: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Sammelbuchung</FieldLabel>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formState.batchBooking}
                    disabled={isLoading}
                    onCheckedChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        batchBooking: Boolean(value),
                      }))
                    }
                  />
                  <span className="text-muted-foreground text-sm">
                    Group transactions into a single statement entry
                  </span>
                </div>
              </Field>
            </form>
          </FramePanel>
          <FrameFooter className="flex-row justify-end gap-2">
            <Button
              type="reset"
              form="sepa-bank-form"
              variant="ghost"
              onClick={() => setFormState(initialState)}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              form="sepa-bank-form"
              disabled={updateMutation.isPending || isLoading}
            >
              {updateMutation.isPending
                ? "Speichern..."
                : "Änderungen speichern"}
            </Button>
          </FrameFooter>
        </Frame>

        <SepaTransactionDetails
          formState={{
            membershipTemplate: formState.membershipTemplate,
            joiningFeeTemplate: formState.joiningFeeTemplate,
            yearlyFeeTemplate: formState.yearlyFeeTemplate,
          }}
          setFormState={(updater) =>
            setFormState((prev) => {
              const current = {
                membershipTemplate: prev.membershipTemplate,
                joiningFeeTemplate: prev.joiningFeeTemplate,
                yearlyFeeTemplate: prev.yearlyFeeTemplate,
              };
              const next =
                typeof updater === "function" ? updater(current) : updater;
              return {
                ...prev,
                membershipTemplate: next.membershipTemplate,
                joiningFeeTemplate: next.joiningFeeTemplate,
                yearlyFeeTemplate: next.yearlyFeeTemplate,
              };
            })
          }
          isLoading={isLoading}
          isSaving={updateMutation.isPending}
          onSubmit={handleSubmit}
          docsHref={transactionDocsUrl}
        />
      </div>
    </div>
  );
}
