import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
  Card,
  CardFooter,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@matdesk/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@matdesk/ui/components/progress";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { cn } from "@matdesk/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BriefcaseIcon,
  CheckIcon,
  CreditCardIcon,
  ReceiptTextIcon,
  SparklesIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { PaymentMethodSheet } from "@/components/dashboard/billing/payment-method-sheet";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/billing")({
  component: RouteComponent,
});

type Frequency = "monthly" | "annually";

type Plan = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  priceCents: number;
  priceAnnualCents: number;
  highlighted?: boolean;
  // `null` limit = unlimited.
  limits: { members: number | null; users: number; ai: number };
  features: string[];
};

// MatDesk subscription tiers. Static for now — wire to the billing provider
// (Stripe products/prices) later.
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Für kleine Vereine im Aufbau.",
    icon: BriefcaseIcon,
    priceCents: 1900,
    priceAnnualCents: 1600,
    limits: { members: 100, users: 3, ai: 500 },
    features: ["Bis zu 100 Mitglieder", "3 Benutzer", "Gruppen & Verträge", "E-Mail-Support"],
  },
  {
    id: "vereins",
    name: "Vereins-Plan",
    description: "Der Standard für aktive Vereine.",
    icon: ZapIcon,
    priceCents: 4900,
    priceAnnualCents: 4100,
    highlighted: true,
    limits: { members: 500, users: 10, ai: 5000 },
    features: [
      "Bis zu 500 Mitglieder",
      "10 Benutzer",
      "SEPA-Lastschrift & Rechnungen",
      "Mitgliederkarte & Statistiken",
      "Prioritäts-Support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Für große Organisationen.",
    icon: SparklesIcon,
    priceCents: 9900,
    priceAnnualCents: 8300,
    limits: { members: null, users: 25, ai: 25000 },
    features: [
      "Unbegrenzte Mitglieder",
      "25 Benutzer",
      "Erweiterte KI-Funktionen",
      "API-Zugriff",
      "Dedizierter Support",
    ],
  },
];

const CURRENT_PLAN_ID = "vereins";
const currentPlan = PLANS.find((plan) => plan.id === CURRENT_PLAN_ID) ?? PLANS[0];

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { currency: "EUR", style: "currency" });
}

function formatNumber(value: number) {
  return value.toLocaleString("de-DE");
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** First of next month — the renewal anchor used across the platform. */
function nextRenewal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function RouteComponent() {
  const { activeOrganization } = useAuth();
  const [showPlans, setShowPlans] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Real member count drives the first usage meter; the others are placeholders
  // until the billing/AI backends report real consumption.
  const membersQuery = useQuery(orpc.members.query.queryOptions({ input: { page: 1, limit: 1 } }));
  const memberCount = membersQuery.data?.pagination.totalCount ?? 0;

  const usage = [
    {
      key: "members",
      label: "Mitglieder",
      used: memberCount,
      limit: currentPlan.limits.members,
      loading: membersQuery.isPending,
    },
    { key: "users", label: "Benutzer", used: 4, limit: currentPlan.limits.users, loading: false },
    { key: "ai", label: "KI-Anfragen", used: 1280, limit: currentPlan.limits.ai, loading: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Abrechnung</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Abonnement und Zahlungen von {activeOrganization?.name ?? "deiner Organisation"} bei
          MatDesk.
        </p>
      </div>

      {/* Current plan */}
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Aktueller Plan</CardFrameTitle>
          <CardFrameDescription>Dein aktives MatDesk-Abonnement.</CardFrameDescription>
          <CardFrameAction>
            <Badge variant="success">Aktiv</Badge>
          </CardFrameAction>
        </CardFrameHeader>
        <Card>
          <CardPanel className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-lg">{currentPlan.name}</p>
                <p className="mt-1 text-muted-foreground text-sm">{currentPlan.description}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold text-lg tabular-nums">
                  {formatCurrency(currentPlan.priceCents)}
                </p>
                <p className="text-muted-foreground text-xs">pro Monat</p>
              </div>
            </div>

            <dl className="grid gap-5 border-t pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Nächste Verlängerung</dt>
                <dd className="mt-1 font-medium text-sm">{formatDate(nextRenewal())}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Abrechnungsintervall</dt>
                <dd className="mt-1 font-medium text-sm">Monatlich</dd>
              </div>
            </dl>

            <div className="border-t pt-5">
              <p className="mb-3 font-medium text-sm">Im Plan enthalten</p>
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {currentPlan.features.map((feature) => (
                  <li className="flex items-center gap-2 text-sm" key={feature}>
                    <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardPanel>
          <CardFooter className="flex flex-wrap justify-between gap-3 border-t">
            <p className="text-muted-foreground text-xs">Monatlich kündbar</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowPlans(true)} size="sm">
                Plan ändern
              </Button>
              <Button size="sm" variant="ghost">
                Abonnement kündigen
              </Button>
            </div>
          </CardFooter>
        </Card>
      </CardFrame>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Usage */}
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>Nutzung</CardFrameTitle>
            <CardFrameDescription>Verbrauch im aktuellen Abrechnungszeitraum.</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel className="flex flex-col gap-5">
              {usage.map((item) => {
                const percent = item.limit
                  ? Math.min(100, Math.round((item.used / item.limit) * 100))
                  : 0;
                return (
                  <Progress key={item.key} value={percent}>
                    <div className="flex items-baseline justify-between">
                      <ProgressLabel>{item.label}</ProgressLabel>
                      {item.loading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {item.limit
                            ? `${formatNumber(item.used)} von ${formatNumber(item.limit)}`
                            : `${formatNumber(item.used)} · Unbegrenzt`}
                        </span>
                      )}
                    </div>
                    <ProgressTrack>
                      <ProgressIndicator />
                    </ProgressTrack>
                  </Progress>
                );
              })}
            </CardPanel>
          </Card>
        </CardFrame>

        {/* Payment method */}
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>Zahlungsmethode</CardFrameTitle>
            <CardFrameDescription>Für die monatliche Abrechnung.</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CreditCardIcon />
                  </EmptyMedia>
                  <EmptyTitle>Keine Zahlungsmethode</EmptyTitle>
                  <EmptyDescription>
                    Hinterlege eine Zahlungsmethode, um dein Abonnement aktiv zu halten.
                  </EmptyDescription>
                </EmptyHeader>
                <Button
                  className="mt-1"
                  onClick={() => setPaymentOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Hinzufügen
                </Button>
              </Empty>
            </CardPanel>
          </Card>
        </CardFrame>
      </div>

      {/* Invoices */}
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Rechnungen</CardFrameTitle>
          <CardFrameDescription>Deine MatDesk-Rechnungen zum Download.</CardFrameDescription>
        </CardFrameHeader>
        <Table className="min-w-[560px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell className="p-0" colSpan={4}>
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ReceiptTextIcon />
                    </EmptyMedia>
                    <EmptyTitle>Noch keine Rechnungen</EmptyTitle>
                    <EmptyDescription>
                      Sobald die erste Abrechnung erfolgt ist, erscheinen deine Rechnungen hier.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardFrame>

      {showPlans ? <PlanChooser onClose={() => setShowPlans(false)} /> : null}
      <PaymentMethodSheet onOpenChange={setPaymentOpen} open={paymentOpen} />
    </div>
  );
}

function PlanChooser({ onClose }: { onClose: () => void }) {
  const [frequency, setFrequency] = useState<Frequency>("annually");

  // Dismiss with Escape, like a modal — without the dialog chrome.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/85 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-2xl tracking-tight">Plan ändern</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Transparente Preise. Jederzeit kündbar.
            </p>
          </div>
          <Button aria-label="Schließen" onClick={onClose} size="icon" variant="ghost">
            <XIcon />
          </Button>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border bg-card p-1 text-sm shadow-xs">
            {(["annually", "monthly"] as const).map((value) => (
              <button
                className={cn(
                  "cursor-pointer rounded-full px-5 py-1.5 font-medium transition-colors",
                  frequency === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
                key={value}
                onClick={() => setFrequency(value)}
                type="button"
              >
                {value === "annually" ? "Jährlich" : "Monatlich"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard frequency={frequency} key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, frequency }: { plan: Plan; frequency: Frequency }) {
  const isCurrent = plan.id === CURRENT_PLAN_ID;
  const price = frequency === "annually" ? plan.priceAnnualCents : plan.priceCents;
  const Icon = plan.icon;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-3xl border bg-card p-6 shadow-xs",
        plan.highlighted && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl border bg-muted/50 text-foreground">
          <Icon className="size-5" />
        </div>
        <div className="flex gap-1.5">
          {plan.highlighted ? <Badge variant="success">Beliebt</Badge> : null}
          {frequency === "annually" ? <Badge variant="secondary">16% sparen</Badge> : null}
        </div>
      </div>

      <h3 className="mt-4 font-semibold text-lg">{plan.name}</h3>
      <p className="mt-1 text-muted-foreground text-sm">{plan.description}</p>

      <div className="mt-5 flex items-end gap-1.5">
        <span className="font-semibold text-3xl tracking-tight">{formatCurrency(price)}</span>
        <span className="pb-1 text-muted-foreground text-sm">
          / Monat{frequency === "annually" ? ", jährlich" : ""}
        </span>
      </div>

      {isCurrent ? (
        <Button className="mt-5 w-full" disabled variant="outline">
          Aktueller Plan
        </Button>
      ) : (
        <Button className="mt-5 w-full" variant={plan.highlighted ? "default" : "outline"}>
          Auswählen
        </Button>
      )}

      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t pt-6">
        {plan.features.map((feature) => (
          <li className="flex items-center gap-2 text-muted-foreground text-sm" key={feature}>
            <CheckIcon className="size-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
