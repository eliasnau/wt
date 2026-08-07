"use client";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@matdesk/ui/components/alert-dialog";
import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import {
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@matdesk/ui/components/card";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseError } from "evlog";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  CREDIT_GRANT_TYPE_LABELS,
  CreditGrantDialog,
} from "@/components/dashboard/members/credit-grant-dialog";
import { formatCents, formatDate, todayYmd } from "@/lib/format";
import { memberTimelineQueryOptions } from "@/queries/members";
import { client, orpc, queryClient } from "@/utils/orpc";

// Inferred from the procedure rather than hand-written, so a schema change on
// credit_grant surfaces here as a type error instead of silent drift.
type Grant = Awaited<ReturnType<typeof client.billing.listCreditGrants>>[number];

type GrantState = "active" | "scheduled" | "exhausted" | "expired" | "revoked";

const STATE_META: Record<
  GrantState,
  { label: string; variant: "success" | "info" | "secondary" | "error" | "outline" }
> = {
  active: { label: "Aktiv", variant: "success" },
  scheduled: { label: "Geplant", variant: "info" },
  exhausted: { label: "Aufgebraucht", variant: "outline" },
  expired: { label: "Abgelaufen", variant: "error" },
  revoked: { label: "Widerrufen", variant: "secondary" },
};

function remainingOf(grant: Grant): number {
  return grant.type === "money" ? (grant.remainingAmountCents ?? 0) : (grant.remainingCycles ?? 0);
}

/** Mirrors the billing engine's eligibility rules (`queries/billing.ts::
 *  loadActiveCreditGrants` gates on `revokedAt IS NULL`, `validFrom <= month`
 *  and `expiresAt >= month`, and `domain/billing/credits.ts` skips anything with
 *  nothing left).
 *
 *  Precedence matters for honest reporting: revocation is an explicit operator
 *  action and outranks every derived state, and exhaustion beats expiry because
 *  a fully-used grant did its job — calling it "abgelaufen" would misreport why
 *  it no longer applies. */
function grantState(grant: Grant, today: string): GrantState {
  if (grant.revokedAt) return "revoked";
  if (remainingOf(grant) <= 0) return "exhausted";
  if (grant.expiresAt && grant.expiresAt < today) return "expired";
  if (grant.validFrom && grant.validFrom > today) return "scheduled";
  return "active";
}

function formatValue(grant: Grant, cents: number | null, cycles: number | null): string {
  if (grant.type === "money") return formatCents(cents);
  if (cycles == null) return "—";
  return `${cycles} ${cycles === 1 ? "Monat" : "Monate"}`;
}

function validityOf(grant: Grant): string {
  if (!grant.validFrom && !grant.expiresAt) return "Unbegrenzt";
  if (grant.validFrom && grant.expiresAt) {
    return `${formatDate(grant.validFrom)} – ${formatDate(grant.expiresAt)}`;
  }
  if (grant.validFrom) return `ab ${formatDate(grant.validFrom)}`;
  return `bis ${formatDate(grant.expiresAt)}`;
}

/** One-line summary of what's still redeemable, for the card description. Money
 *  and free months are separate currencies, so they're summed separately rather
 *  than collapsed into a single figure. */
function summarize(grants: Grant[], today: string): string {
  if (grants.length === 0) return "Keine Guthaben vergeben.";
  const usable = grants.filter((g) => {
    const state = grantState(g, today);
    return state === "active" || state === "scheduled";
  });
  const cents = usable
    .filter((g) => g.type === "money")
    .reduce((sum, g) => sum + (g.remainingAmountCents ?? 0), 0);
  const cycles = usable
    .filter((g) => g.type === "billing_cycles")
    .reduce((sum, g) => sum + (g.remainingCycles ?? 0), 0);

  // "Guthaben" is its own plural in German — no inflection needed.
  const count = `${grants.length} Guthaben`;
  const parts: string[] = [];
  if (cents > 0) parts.push(`${formatCents(cents)} offen`);
  if (cycles > 0) parts.push(`${cycles} ${cycles === 1 ? "freier Monat" : "freie Monate"} offen`);
  if (parts.length === 0) return `${count} · nichts mehr anrechenbar.`;
  return `${count} · ${parts.join(" · ")}.`;
}

export function MemberCreditsCard({
  memberId,
  contractId,
  memberName,
}: {
  memberId: string;
  contractId: string;
  memberName: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revoking, setRevoking] = useState<Grant | null>(null);
  const query = useQuery(orpc.billing.listCreditGrants.queryOptions({ input: { memberId } }));

  const revokeMutation = useMutation(
    orpc.billing.revokeCreditGrant.mutationOptions({
      onSuccess: () => {
        toast.success("Guthaben widerrufen");
        void queryClient.invalidateQueries({
          queryKey: orpc.billing.listCreditGrants.key({ input: { memberId } }),
        });
        void queryClient.invalidateQueries({
          queryKey: memberTimelineQueryOptions(memberId).queryKey,
        });
        setRevoking(null);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const today = todayYmd();
  const grants: Grant[] = query.data ?? [];

  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Guthaben</CardFrameTitle>
          <CardFrameDescription>
            {query.isPending
              ? "Guthaben werden geladen…"
              : query.isError
                ? "Guthaben konnten nicht geladen werden."
                : summarize(grants, today)}
          </CardFrameDescription>
          <CardFrameAction>
            <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline">
              <PlusIcon />
              Guthaben hinzufügen
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Table className="min-w-[680px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Typ</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead className="w-28">Original</TableHead>
              <TableHead className="w-28">Verbleibend</TableHead>
              <TableHead className="w-44">Gültigkeit</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              Array.from({ length: 2 }, (_, i) => (
                <TableRow className="hover:bg-transparent" key={i}>
                  {Array.from({ length: 7 }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-8 text-center" colSpan={7}>
                  <p className="text-muted-foreground text-sm">{parseError(query.error).message}</p>
                  <Button
                    className="mt-3"
                    onClick={() => query.refetch()}
                    size="sm"
                    variant="outline"
                  >
                    Erneut versuchen
                  </Button>
                </TableCell>
              </TableRow>
            ) : grants.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-8 text-center text-muted-foreground" colSpan={7}>
                  Keine Guthaben vergeben.
                </TableCell>
              </TableRow>
            ) : (
              grants.map((grant) => {
                const stateKey = grantState(grant, today);
                const state = STATE_META[stateKey];
                // A revoked grant may still show a positive balance; it just
                // can't be drawn any more, so mute it like an exhausted one.
                const inert = stateKey === "exhausted" || stateKey === "revoked";
                return (
                  <TableRow key={grant.id}>
                    <TableCell>
                      <Badge variant="outline">{CREDIT_GRANT_TYPE_LABELS[grant.type]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-0 truncate text-foreground">
                      {grant.description || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatValue(grant, grant.originalAmountCents, grant.originalCycles)}
                    </TableCell>
                    <TableCell
                      className={
                        inert ? "font-mono text-muted-foreground text-sm" : "font-mono text-sm"
                      }
                    >
                      {formatValue(grant, grant.remainingAmountCents, grant.remainingCycles)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {validityOf(grant)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </TableCell>
                    <TableCell className="w-px">
                      {grant.revokedAt ? null : (
                        <Button
                          aria-label="Guthaben widerrufen"
                          onClick={() => setRevoking(grant)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardFrame>

      <CreditGrantDialog
        contractId={contractId}
        memberId={memberId}
        memberName={memberName}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
        open={Boolean(revoking)}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Guthaben widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              {revoking
                ? `Das Guthaben (${formatValue(revoking, revoking.originalAmountCents, revoking.originalCycles)}) wird ab sofort nicht mehr auf Rechnungen angerechnet. Bereits angerechnete Beträge bleiben bestehen.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              loading={revokeMutation.isPending}
              onClick={() => revoking && revokeMutation.mutate({ id: revoking.id })}
              variant="destructive"
            >
              Widerrufen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
