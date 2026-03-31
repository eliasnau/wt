"use client";

import {
  AtSignIcon,
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  MapPinIcon,
  PhoneIcon,
  ShieldAlert,
  ShieldCheck,
  UserIcon,
  Users,
} from "lucide-react";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isValid, parse } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { OrganizationAvatar } from "@/components/organization-avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { client, orpc } from "@/utils/orpc";

const stepLabels = [
  "Willkommen!",
  "Persönliche Daten",
  "Adresse",
  "Zahlung",
  "Prüfen",
] as const;

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/60 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </div>
  );
}

type MemberRegistrationFormProps = {
  code: string;
};

type RegistrationGroup = {
  groupId: string;
  groupNameSnapshot: string;
  schedule?: string;
  monthlyFee: string;
};

function formatCurrency(value?: string | null) {
  if (!value) return "-";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return `EUR ${parsed.toFixed(2)}`;
}

function formatGermanDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE");
}

function normalizeGroups(value: unknown): RegistrationGroup[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (
        typeof row.groupId !== "string" ||
        typeof row.groupNameSnapshot !== "string" ||
        typeof row.monthlyFee !== "string"
      ) {
        return null;
      }
      const normalized: RegistrationGroup = {
        groupId: row.groupId,
        groupNameSnapshot: row.groupNameSnapshot,
        monthlyFee: row.monthlyFee,
      };
      if (typeof row.schedule === "string") {
        normalized.schedule = row.schedule;
      }
      return normalized;
    })
    .filter((row): row is RegistrationGroup => row !== null);
}

type RegistrationFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthdate: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  accountHolder: string;
  iban: string;
  bic: string;
  acceptedTerms: boolean;
};

const initialValues: RegistrationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthdate: "",
  street: "",
  city: "",
  zip: "",
  country: "",
  accountHolder: "",
  iban: "",
  bic: "",
  acceptedTerms: false,
};

export function MemberRegistrationForm({
  code,
}: MemberRegistrationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [values, setValues] = useState<RegistrationFormValues>(initialValues);
  const [birthMonth, setBirthMonth] = useState<Date>(new Date(2005, 0, 1));

  const totalSteps = stepLabels.length;
  const normalizedCode = code.trim().toLowerCase();

  const { data, isPending, error } = useQuery(
    orpc.selfRegistrations.getPublicByCode.queryOptions({
      input: { code: normalizedCode },
      retry: false,
    }),
  );

  const submitMutation = useMutation({
    mutationFn: async () =>
      client.selfRegistrations.submit({
        code: normalizedCode,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        birthdate: values.birthdate,
        street: values.street.trim(),
        city: values.city.trim(),
        postalCode: values.zip.trim(),
        country: values.country.trim(),
        accountHolder: values.accountHolder.trim(),
        iban: values.iban.trim(),
        bic: values.bic.trim(),
      }),
    onSuccess: () => {
      setStepError(null);
      setSubmitted(true);
    },
    onError: (submitError) => {
      setStepError(submitError.message || "Registrierung konnte nicht gesendet werden.");
    },
  });

  const prefilledGroups = normalizeGroups(data?.groups);
  const prefilledContract = {
    billing: "Monatlich",
    initialPeriod:
      data?.billingCycle === "monthly"
        ? "Monatlich"
        : data?.billingCycle === "half_yearly"
          ? "Halbjährlich"
          : data?.billingCycle === "yearly"
            ? "Jährlich"
            : "-",
    joiningFee: formatCurrency(data?.joiningFeeAmount),
    yearlyFee: formatCurrency(data?.yearlyFeeAmount),
    contractStart: formatGermanDate(data?.contractStartDate),
  };

  const canContinueStep = useMemo(() => {
    if (currentStep === 0) {
      return true;
    }

    if (currentStep === 1) {
      return (
        values.firstName.trim().length > 0 &&
        values.lastName.trim().length > 0 &&
        (values.email.trim().length === 0 ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) &&
        values.birthdate.trim().length > 0
      );
    }

    if (currentStep === 2) {
      return (
        values.street.trim().length > 0 &&
        values.city.trim().length > 0 &&
        values.zip.trim().length > 0 &&
        values.country.trim().length > 0
      );
    }

    if (currentStep === 3) {
      return (
        values.accountHolder.trim().length > 0 &&
        values.iban.trim().length > 0 &&
        values.bic.trim().length > 0
      );
    }

    return (
      values.acceptedTerms
    );
  }, [currentStep, values]);

  const goNext = () => {
    if (!canContinueStep) {
      if (currentStep === 1) {
        setStepError(
          "Bitte vervollständige Vorname, Nachname und Geburtsdatum. Falls du eine E-Mail angibst, muss sie gültig sein.",
        );
      } else if (currentStep === 2) {
        setStepError("Bitte fülle alle Adressfelder aus.");
      } else if (currentStep === 3) {
        setStepError("Bitte fülle alle Zahlungsdaten aus.");
      } else if (currentStep === 4) {
        setStepError(
          "Bitte bestätige die Angaben vor dem Absenden.",
        );
      } else {
        setStepError("Bitte vervollständige diesen Schritt, um fortzufahren.");
      }
      return;
    }

    setStepError(null);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const goBack = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canContinueStep) {
      setStepError(
        "Bitte bestätige die Angaben vor dem Absenden.",
      );
      return;
    }

    setStepError(null);
    await submitMutation.mutateAsync();
  };

  const resetForm = () => {
    setSubmitted(false);
    setCurrentStep(0);
    setStepError(null);
    setValues(initialValues);
    setBirthMonth(new Date(2005, 0, 1));
  };

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" monochrome />

        <div className="z-10 mt-auto space-y-3">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Selbstregistrierung
          </p>
          <div className="flex items-center gap-3 rounded-lg border bg-background/70 p-3">
            <OrganizationAvatar
              id={data?.organization?.id || "org-unknown"}
              name={data?.organization?.name || "Organisation"}
              logo={data?.organization?.logo || null}
              className="size-10"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">
                {data?.organization?.name || "Organisation"}
              </p>
              <p className="text-muted-foreground text-xs">Mitgliedsanmeldung</p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8 py-10 lg:py-0">
        <div
          aria-hidden
          className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
        >
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Logo className="h-4.5 lg:hidden" monochrome />

          {isPending ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Registrierung wird geladen</EmptyTitle>
                <EmptyDescription>Bitte einen Moment warten.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : !data || (error instanceof ORPCError && error.code === "NOT_FOUND") ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldAlert />
                </EmptyMedia>
                <EmptyTitle>Registrierungscode nicht gefunden</EmptyTitle>
                <EmptyDescription>
                  Der Code <strong>{code}</strong> ist ungültig oder abgelaufen.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href={"/" as Route} />} variant="outline">
                  Zur Startseite
                </Button>
              </EmptyContent>
            </Empty>
          ) : data.status !== "draft" ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck />
                </EmptyMedia>
                <EmptyTitle>Registrierung bereits ausgefüllt</EmptyTitle>
                <EmptyDescription>
                  Der Code <strong>{code}</strong> wurde bereits verwendet und ist nicht mehr verfügbar.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href={"/" as Route} />} variant="outline">
                  Zur Startseite
                </Button>
              </EmptyContent>
            </Empty>
          ) : submitted ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-6 text-emerald-600" />
              </div>
              <p className="font-medium">Registrierung gesendet</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Danke. Deine Registrierung für den Code <strong>{code}</strong> wurde gesendet.
              </p>
              <Button className="mt-4" onClick={resetForm} variant="outline">
                Erneut ausfüllen
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-2">
                <h1 className="font-bold text-2xl tracking-wide">Registrierung abschließen</h1>
                <p className="text-base text-muted-foreground">
                  Schritt {currentStep + 1} von {totalSteps}: {stepLabels[currentStep]}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {stepLabels.map((label, index) => {
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;
                    return (
                      <div
                        key={label}
                        className={`rounded-md border px-2 py-1.5 text-center text-xs ${
                          isActive
                            ? "border-foreground/30 bg-foreground/5 font-medium"
                            : isDone
                              ? "border-border bg-background"
                              : "border-border/70 bg-background/40 text-muted-foreground"
                        }`}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                {currentStep === 0 ? (
                  <section className="space-y-4">
                    <div className="space-y-2">
                      <h2 className="font-semibold text-base">Wilkommen!</h2>
                      <p className="text-muted-foreground text-sm">
                        Bitte prüfe zuerst deine vordefinierten Vertragsdaten.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <ReadonlyField label="Abrechnung" value={prefilledContract.billing} />
                      <ReadonlyField label="Vertragslaufzeit" value={prefilledContract.initialPeriod} />
                      <ReadonlyField label="Aufnahmegebühr" value={prefilledContract.joiningFee} />
                      <ReadonlyField label="Jahresbeitrag" value={prefilledContract.yearlyFee} />
                      <ReadonlyField label="Vertragsbeginn" value={prefilledContract.contractStart} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Kündigung nach Ablauf der Laufzeit monatlich möglich.
                    </p>

                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Gruppenzuordnung</h3>
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Lock className="size-3" /> Vorgabe
                        </span>
                      </div>
                      <div className="space-y-2">
                        {prefilledGroups.map((group) => (
                          <article
                            key={group.groupId}
                            className="rounded-lg border bg-background px-3 py-2.5"
                          >
                            <p className="font-medium text-sm">{group.groupNameSnapshot}</p>
                            <p className="text-muted-foreground text-xs">{group.schedule || "-"}</p>
                            <p className="mt-1 font-medium text-xs">
                              Monatsbeitrag: {formatCurrency(group.monthlyFee)}
                            </p>
                          </article>
                        ))}
                        {prefilledGroups.length === 0 ? (
                          <p className="text-muted-foreground text-sm">
                            Keine Gruppenzuordnung vorhanden.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                {currentStep === 1 ? (
                  <section className="space-y-3">
                    <h2 className="font-semibold text-base">Persönliche Daten</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <UserIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Vorname"
                          value={values.firstName}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, firstName: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <UserIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Nachname"
                          value={values.lastName}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, lastName: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <AtSignIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="E-Mail"
                          type="email"
                          value={values.email}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <PhoneIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Telefon"
                          type="tel"
                          value={values.phone}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, phone: event.target.value }))
                          }
                        />
                      </InputGroup>
                      <InputGroup className="md:col-span-2">
                        <Popover>
                          <InputGroupInput
                            aria-label="Geburtsdatum auswählen"
                            className="*:[input]:[&::-webkit-calendar-picker-indicator]:hidden *:[input]:[&::-webkit-calendar-picker-indicator]:appearance-none"
                            placeholder="Geburtsdatum"
                            type="date"
                            value={values.birthdate}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setValues((prev) => ({ ...prev, birthdate: nextValue }));

                              if (nextValue) {
                                const parsedDate = parse(
                                  nextValue,
                                  "yyyy-MM-dd",
                                  new Date(),
                                );
                                if (isValid(parsedDate)) {
                                  setBirthMonth(parsedDate);
                                }
                              }
                            }}
                            required
                          />
                          <InputGroupAddon>
                            <PopoverTrigger
                              aria-label="Kalender öffnen"
                              render={
                                <Button
                                  aria-label="Kalender öffnen"
                                  size="icon-xs"
                                  variant="ghost"
                                />
                              }
                            >
                              <CalendarIcon aria-hidden="true" />
                            </PopoverTrigger>
                          </InputGroupAddon>
                          <PopoverPopup align="start" alignOffset={-4} sideOffset={8}>
                            <Calendar
                              captionLayout="dropdown"
                              month={birthMonth}
                              mode="single"
                              onMonthChange={setBirthMonth}
                              onSelect={(selectedDate) => {
                                if (!selectedDate) {
                                  setValues((prev) => ({ ...prev, birthdate: "" }));
                                  return;
                                }

                                setValues((prev) => ({
                                  ...prev,
                                  birthdate: format(selectedDate, "yyyy-MM-dd"),
                                }));
                                setBirthMonth(selectedDate);
                              }}
                              selected={(() => {
                                if (!values.birthdate) return undefined;
                                const parsedDate = parse(
                                  values.birthdate,
                                  "yyyy-MM-dd",
                                  new Date(),
                                );
                                return isValid(parsedDate) ? parsedDate : undefined;
                              })()}
                            />
                          </PopoverPopup>
                        </Popover>
                      </InputGroup>
                    </div>
                  </section>
                ) : null}

                {currentStep === 2 ? (
                  <section className="space-y-3">
                    <h2 className="font-semibold text-base">Adresse</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InputGroup className="md:col-span-2">
                        <InputGroupAddon align="inline-start">
                          <MapPinIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Straße"
                          value={values.street}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, street: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <MapPinIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Stadt"
                          value={values.city}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, city: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <MapPinIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="PLZ"
                          value={values.zip}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, zip: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup className="md:col-span-2">
                        <InputGroupAddon align="inline-start">
                          <MapPinIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Land"
                          value={values.country}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, country: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                    </div>
                  </section>
                ) : null}

                {currentStep === 3 ? (
                  <section className="space-y-4">
                    <div className="space-y-3">
                      <h2 className="font-semibold text-base">Zahlungsdaten</h2>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <UserIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Kontoinhaber"
                          value={values.accountHolder}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              accountHolder: event.target.value,
                            }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <CreditCard />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="IBAN"
                          value={values.iban}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, iban: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <CreditCard />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="BIC"
                          value={values.bic}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, bic: event.target.value }))
                          }
                          required
                        />
                      </InputGroup>
                    </div>

                    <label className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                      <span>Zahlungsdaten können von dir bearbeitet werden.</span>
                    </label>
                  </section>
                ) : null}

                {currentStep === 4 ? (
                  <section className="space-y-4">
                    <h2 className="font-semibold text-base">Prüfen</h2>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <ReadonlyField label="Vorname" value={values.firstName || "-"} />
                      <ReadonlyField label="Nachname" value={values.lastName || "-"} />
                      <ReadonlyField label="E-Mail" value={values.email || "-"} />
                      <ReadonlyField label="Telefon" value={values.phone || "-"} />
                      <ReadonlyField label="Geburtsdatum" value={values.birthdate || "-"} />
                      <ReadonlyField label="Straße" value={values.street || "-"} />
                      <ReadonlyField label="Stadt" value={values.city || "-"} />
                      <ReadonlyField label="PLZ" value={values.zip || "-"} />
                      <ReadonlyField label="Land" value={values.country || "-"} />
                      <ReadonlyField label="Kontoinhaber" value={values.accountHolder || "-"} />
                      <ReadonlyField label="IBAN" value={values.iban || "-"} />
                      <ReadonlyField label="BIC" value={values.bic || "-"} />
                      <ReadonlyField label="Abrechnung" value={prefilledContract.billing} />
                      <ReadonlyField label="Vertragslaufzeit" value={prefilledContract.initialPeriod} />
                      <ReadonlyField
                        label="Monatsbeitrag"
                        value={
                          prefilledGroups[0]
                            ? formatCurrency(prefilledGroups[0].monthlyFee)
                            : "-"
                        }
                      />
                    </div>

                    <label className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4"
                        checked={values.acceptedTerms}
                        onChange={(event) =>
                          setValues((prev) => ({
                            ...prev,
                            acceptedTerms: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        Ich bestätige, dass alle Angaben korrekt sind. Gruppenzuordnung und
                        Vertragskosten sind von der Organisation festgelegt.
                      </span>
                    </label>

                    <div className="rounded-lg border border-dashed px-3 py-2">
                      <p className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed">
                        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                        Letzter Schritt vor dem Absenden.
                      </p>
                    </div>
                  </section>
                ) : null}

                {stepError ? <p className="text-destructive text-sm">{stepError}</p> : null}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft data-icon="inline-start" />
                    Zurück
                  </Button>

                  {currentStep < totalSteps - 1 ? (
                    <Button type="button" onClick={goNext}>
                      Weiter
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? "Wird gesendet..." : "Registrierung senden"}
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
