import { Badge } from "@matdesk/ui/components/badge";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@matdesk/ui/components/alert-dialog";
import { Button } from "@matdesk/ui/components/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@matdesk/ui/components/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@matdesk/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@matdesk/ui/components/tabs";
import { Textarea } from "@matdesk/ui/components/textarea";
import { cn } from "@matdesk/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseError } from "evlog";
import { AwardIcon, CheckIcon, ListIcon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, type Ref, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { client, orpc, queryClient } from "@/utils/orpc";
import { memberTimelineQueryOptions } from "@/queries/members";

type Systems = Awaited<ReturnType<typeof client.progression.listSystems>>;
type Awards = Awaited<ReturnType<typeof client.progression.listMemberRanks>>;
type System = Systems[number];
type Award = Awards[number];
type Celebration = { systemId: string; rankId: string };

const CONFETTI_PARTICLES = [
  { x: -42, y: -34, rotate: -75, color: "#f59e0b" },
  { x: -24, y: -48, rotate: 55, color: "#22c55e" },
  { x: -8, y: -42, rotate: -35, color: "#3b82f6" },
  { x: 13, y: -50, rotate: 80, color: "#a855f7" },
  { x: 31, y: -38, rotate: -60, color: "#ef4444" },
  { x: 45, y: -19, rotate: 45, color: "#f59e0b" },
  { x: -46, y: -12, rotate: 70, color: "#06b6d4" },
  { x: 28, y: -8, rotate: -85, color: "#ec4899" },
] as const;

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function formatAwardDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function refreshMemberRanks(memberId: string) {
  void queryClient.invalidateQueries({
    queryKey: orpc.progression.listMemberRanks.key({ input: { memberId } }),
  });
  void queryClient.invalidateQueries({ queryKey: memberTimelineQueryOptions(memberId).queryKey });
}

export function MemberProgressionCard({ memberId }: { memberId: string }) {
  const systemsQuery = useQuery(orpc.progression.listSystems.queryOptions());
  const awardsQuery = useQuery(
    orpc.progression.listMemberRanks.queryOptions({ input: { memberId } }),
  );
  const systems = systemsQuery.data ?? [];
  const awards = awardsQuery.data ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSystemId, setDialogSystemId] = useState<string | undefined>();
  const [dialogRankId, setDialogRankId] = useState<string | undefined>();
  const [editingAward, setEditingAward] = useState<Award | undefined>();
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  useEffect(() => {
    if (!celebration) return;
    const timeout = window.setTimeout(() => setCelebration(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  function openAwardDialog(systemId?: string, rankId?: string, award?: Award) {
    setDialogSystemId(systemId);
    setDialogRankId(rankId);
    setEditingAward(award);
    setDialogOpen(true);
  }

  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Graduierungen</CardFrameTitle>
          <CardFrameDescription>Fortschritt, Auszeichnungen und Verlauf.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel className="p-0">
            {systems.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AwardIcon />
                  </EmptyMedia>
                  <EmptyTitle>Keine Graduierungssysteme</EmptyTitle>
                  <EmptyDescription>
                    Richte zuerst ein System unter Graduierungen ein.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Tabs
                className="gap-0"
                defaultValue={systems[0]?.id}
                key={systems.map((system) => system.id).join(":")}
              >
                <div className="overflow-x-auto border-b px-5 pt-4">
                  <TabsList variant="underline">
                    {systems.map((system) => (
                      <TabsTab key={system.id} value={system.id}>
                        {system.name}
                      </TabsTab>
                    ))}
                  </TabsList>
                </div>
                {systems.map((system) => (
                  <TabsPanel className="p-5" key={system.id} value={system.id}>
                    <SystemProgression
                      awards={awards.filter((item) => item.system.id === system.id)}
                      celebratedRankId={
                        celebration?.systemId === system.id ? celebration.rankId : undefined
                      }
                      memberId={memberId}
                      onAwarded={(rankId) => setCelebration({ systemId: system.id, rankId })}
                      onEditAward={(award) => openAwardDialog(system.id, award.rank.id, award)}
                      onSelectRank={(rankId) => openAwardDialog(system.id, rankId)}
                      system={system}
                    />
                  </TabsPanel>
                ))}
              </Tabs>
            )}
          </CardPanel>
        </Card>
      </CardFrame>
      <AwardDialog
        initialRankId={dialogRankId}
        initialSystemId={dialogSystemId}
        editingAward={editingAward}
        memberId={memberId}
        onAwarded={(systemId, rankId) => setCelebration({ systemId, rankId })}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        systems={systems}
      />
    </>
  );
}

function SystemProgression({
  system,
  awards,
  celebratedRankId,
  memberId,
  onAwarded,
  onSelectRank,
  onEditAward,
}: {
  system: System;
  awards: Awards;
  celebratedRankId?: string;
  memberId: string;
  onAwarded: (rankId: string) => void;
  onSelectRank: (rankId?: string) => void;
  onEditAward: (award: Award) => void;
}) {
  const heldIds = useMemo(() => new Set(awards.map((item) => item.rank.id)), [awards]);
  const awardByRank = useMemo(() => new Map(awards.map((item) => [item.rank.id, item])), [awards]);
  const [allRanksOpen, setAllRanksOpen] = useState(false);
  const current =
    system.mode === "sequential"
      ? awards.reduce<(typeof awards)[number] | undefined>(
          (highest, item) =>
            !highest || item.rank.sortOrder > highest.rank.sortOrder ? item : highest,
          undefined,
        )
      : undefined;
  const nextRank =
    system.mode === "sequential"
      ? system.ranks.find((rank) => rank.sortOrder > (current?.rank.sortOrder ?? -1))
      : undefined;
  const currentIndex = current ? system.ranks.findIndex((rank) => rank.id === current.rank.id) : -1;
  const latestCollectionAward =
    system.mode === "collection"
      ? [...awards].sort((a, b) => b.award.awardedOn.localeCompare(a.award.awardedOn))[0]
      : undefined;
  const nextCollectionRank =
    system.mode === "collection" ? system.ranks.find((rank) => !heldIds.has(rank.id)) : undefined;
  const awardNext = useMutation(
    orpc.progression.awardRank.mutationOptions({
      onSuccess: (_data, variables) => {
        onAwarded(variables.rankId);
        refreshMemberRanks(memberId);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const visibleNodeCount = Math.min(3, system.ranks.length);
  const nodeAnchorIndex =
    system.mode === "sequential"
      ? Math.max(currentIndex, 0)
      : Math.max(
          system.ranks.findIndex((rank) => rank.id === latestCollectionAward?.rank.id),
          0,
        );
  const nodeStartIndex = Math.min(
    Math.max(nodeAnchorIndex - 1, 0),
    system.ranks.length - visibleNodeCount,
  );
  const progressionNodes = system.ranks
    .slice(nodeStartIndex, nodeStartIndex + visibleNodeCount)
    .map((rank, index) => {
      const award = awardByRank.get(rank.id);
      const isCurrent =
        system.mode === "sequential"
          ? rank.id === current?.rank.id
          : rank.id === latestCollectionAward?.rank.id;
      const isNext =
        system.mode === "sequential"
          ? rank.id === nextRank?.id
          : rank.id === nextCollectionRank?.id;
      return {
        rank,
        award,
        current: isCurrent,
        label: isCurrent
          ? system.mode === "sequential"
            ? "Aktuelle Stufe"
            : "Zuletzt verliehen"
          : isNext
            ? current || latestCollectionAward
              ? "Nächste Stufe"
              : "Erste Stufe"
            : award
              ? index === visibleNodeCount - 2
                ? "Vorherige Stufe"
                : "Frühere Stufe"
              : "Spätere Stufe",
      };
    });

  if (system.ranks.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AwardIcon />
          </EmptyMedia>
          <EmptyTitle>Noch keine Stufen</EmptyTitle>
          <EmptyDescription>
            Für dieses System wurden noch keine Graduierungen angelegt.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {system.mode === "sequential" ? "Fortschritt" : "Sammlung"}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {awards.length} von {system.ranks.length} erreicht
          </span>
        </div>
        <Button onClick={() => setAllRanksOpen(true)} size="sm" variant="outline">
          <ListIcon /> Alle Stufen
        </Button>
      </div>

      <div className="relative grid grid-cols-3 rounded-xl border px-3 py-5">
        {progressionNodes.length > 1 ? (
          <span
            aria-hidden="true"
            className="absolute top-[4.25rem] right-[16.67%] left-[16.67%] h-px bg-border"
          />
        ) : null}
        <AnimatePresence initial={false} mode="popLayout">
          {progressionNodes.map((node, index) => (
            <ProgressNode
              action={
                system.mode === "sequential" && !node.award ? (
                  <Button
                    className="mt-3 w-full"
                    disabled={node.rank.id !== nextRank?.id}
                    loading={awardNext.isPending && node.rank.id === nextRank?.id}
                    onClick={() =>
                      awardNext.mutate({
                        memberId,
                        systemId: system.id,
                        rankId: node.rank.id,
                        awardedOn: todayYmd(),
                      })
                    }
                    size="sm"
                  >
                    <SparklesIcon /> Stufe verleihen
                  </Button>
                ) : system.mode === "collection" && !node.award ? (
                  <Button
                    className="mt-3 w-full"
                    disabled={node.rank.id !== nextCollectionRank?.id}
                    onClick={() => onSelectRank(node.rank.id)}
                    size="sm"
                  >
                    <PlusIcon /> Verleihen
                  </Button>
                ) : undefined
              }
              award={node.award}
              className={
                progressionNodes.length === 1
                  ? "col-start-1"
                  : progressionNodes.length === 2 && index === 1
                    ? "col-start-3"
                    : undefined
              }
              current={node.current}
              celebrating={node.rank.id === celebratedRankId}
              key={node.rank.id}
              label={node.label}
              rank={node.rank}
              onEditAward={onEditAward}
            />
          ))}
        </AnimatePresence>
      </div>

      <Sheet onOpenChange={setAllRanksOpen} open={allRanksOpen}>
        <SheetPopup className="max-w-md">
          <SheetHeader>
            <SheetTitle>{system.name}</SheetTitle>
            <SheetDescription>Alle Stufen von der ersten bis zur höchsten.</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <div className="py-2">
              {system.ranks.map((rank, index) => {
                const award = awardByRank.get(rank.id);
                const held = Boolean(award);
                const isCurrent = current?.rank.id === rank.id;
                return (
                  <div className="relative flex gap-4" key={rank.id}>
                    <div className="flex w-10 shrink-0 flex-col items-center">
                      <button
                        aria-label={`${rank.name} ${held ? "bearbeiten" : "verleihen"}`}
                        className={cn(
                          "relative z-10 flex size-10 items-center justify-center rounded-full border-4 border-background shadow-sm ring-1 ring-border transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
                          isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                        onClick={() => (award ? onEditAward(award) : onSelectRank(rank.id))}
                        style={{ backgroundColor: rank.color ?? "var(--muted)" }}
                        type="button"
                      >
                        {held ? <CheckIcon className="size-4 text-white drop-shadow-sm" /> : null}
                      </button>
                      {index < system.ranks.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "min-h-8 w-0.5 flex-1 bg-border",
                            held && "bg-emerald-500/50",
                          )}
                        />
                      ) : null}
                    </div>
                    <button
                      className="mb-3 min-w-0 flex-1 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => (award ? onEditAward(award) : onSelectRank(rank.id))}
                      type="button"
                    >
                      <span className="text-muted-foreground text-xs tabular-nums">
                        Stufe {index + 1}
                      </span>
                      <span className="mt-0.5 block font-medium">{rank.name}</span>
                      <span
                        className={cn(
                          "mt-1 block text-xs",
                          held ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                      >
                        {isCurrent
                          ? "Aktuell"
                          : held
                            ? `Erreicht am ${formatAwardDate(award!.award.awardedOn)}`
                            : "Ausstehend"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
    </div>
  );
}

function ProgressNode({
  label,
  rank,
  current,
  celebrating,
  action,
  award,
  className,
  onEditAward,
  ref,
}: {
  label: string;
  rank: { name: string; color: string | null };
  current?: boolean;
  celebrating?: boolean;
  action?: ReactNode;
  award?: Award;
  className?: string;
  onEditAward: (award: Award) => void;
  ref?: Ref<HTMLDivElement>;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className={cn("relative z-10 flex min-w-0 flex-col items-center px-2 text-center", className)}
      exit={{ opacity: 0, x: -36 }}
      initial={{ opacity: 0, x: 36 }}
      layout="position"
      ref={ref}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <button
        className={cn(
          "relative mt-2 flex size-10 items-center justify-center rounded-full border-4 border-background bg-muted shadow-sm ring-1 ring-border",
          current && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
        disabled={!award}
        onClick={() => award && onEditAward(award)}
        style={rank.color ? { backgroundColor: rank.color } : undefined}
        type="button"
      >
        {current ? <CheckIcon className="size-4 text-white drop-shadow-sm" /> : null}
        <AnimatePresence>
          {celebrating ? (
            <RankCelebration color={rank.color} reducedMotion={Boolean(shouldReduceMotion)} />
          ) : null}
        </AnimatePresence>
      </button>
      <span className="mt-2 max-w-full truncate font-medium text-sm">{rank.name}</span>
      {award ? (
        <button
          className="mt-0.5 text-muted-foreground text-xs hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onEditAward(award)}
          type="button"
        >
          {formatAwardDate(award.award.awardedOn)}
        </button>
      ) : null}
      {action ? <div className="w-full max-w-44">{action}</div> : null}
    </motion.div>
  );
}

function RankCelebration({
  color,
  reducedMotion,
}: {
  color: string | null;
  reducedMotion: boolean;
}) {
  const accent = color ?? "var(--primary)";

  return (
    <>
      <span className="sr-only" role="status">
        Graduierung erfolgreich verliehen
      </span>
      <motion.span
        animate={{ opacity: 0, scale: reducedMotion ? 1.15 : 1.8 }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0.8, scale: 0.8 }}
        transition={{ duration: reducedMotion ? 0.2 : 0.65, ease: [0.16, 1, 0.3, 1] }}
      />
      {reducedMotion ? null : (
        <>
          <motion.span
            animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.6], x: [-72, 0, 4] }}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-2 rounded-full shadow-[0_0_12px_currentColor]"
            initial={{ opacity: 0, x: -72 }}
            style={{ backgroundColor: accent, color: accent }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
          {CONFETTI_PARTICLES.map((particle, index) => (
            <motion.span
              animate={{
                opacity: [0, 1, 1, 0],
                rotate: particle.rotate,
                scale: [0.5, 1, 0.85],
                x: particle.x,
                y: particle.y,
              }}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1 rounded-[1px]"
              initial={{ opacity: 0, rotate: 0, scale: 0.5, x: 0, y: 0 }}
              key={`${particle.x}:${particle.y}`}
              style={{ backgroundColor: particle.color }}
              transition={{
                delay: 0.28 + index * 0.018,
                duration: 0.75,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </>
      )}
    </>
  );
}

function AwardDialog({
  memberId,
  open,
  onOpenChange,
  systems,
  initialSystemId,
  initialRankId,
  editingAward,
  onAwarded,
}: {
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systems: Systems;
  initialSystemId?: string;
  initialRankId?: string;
  editingAward?: Award;
  onAwarded: (systemId: string, rankId: string) => void;
}) {
  const available = useMemo(() => systems.filter((system) => system.ranks.length > 0), [systems]);
  const [systemId, setSystemId] = useState("");
  const [rankId, setRankId] = useState("");
  const [awardedOn, setAwardedOn] = useState(todayYmd());
  const [notes, setNotes] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    setSystemId(initialSystemId ?? available[0]?.id ?? "");
    setRankId(initialRankId ?? "");
    setAwardedOn(editingAward?.award.awardedOn ?? todayYmd());
    setNotes(editingAward?.award.notes ?? "");
  }, [available, editingAward, initialRankId, initialSystemId, open]);
  const selectedSystem = available.find((system) => system.id === systemId) ?? available[0];
  const mutation = useMutation(
    orpc.progression.awardRank.mutationOptions({
      onSuccess: (_data, variables) => {
        onAwarded(variables.systemId, variables.rankId);
        refreshMemberRanks(memberId);
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const updateMutation = useMutation(
    orpc.progression.updateAward.mutationOptions({
      onSuccess: () => {
        refreshMemberRanks(memberId);
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const deleteMutation = useMutation(
    orpc.progression.deleteAward.mutationOptions({
      onSuccess: () => {
        refreshMemberRanks(memberId);
        setDeleteOpen(false);
        onOpenChange(false);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const effectiveSystemId = systemId || selectedSystem?.id || "";
  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogPopup className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAward ? "Verleihungsdatum bearbeiten" : "Graduierung verleihen"}
            </DialogTitle>
            <DialogDescription>
              Die Verleihung wird dauerhaft im Verlauf gespeichert.
            </DialogDescription>
          </DialogHeader>
          <Form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingAward) {
                updateMutation.mutate({
                  awardId: editingAward.award.id,
                  awardedOn,
                  notes: notes || undefined,
                });
              } else if (effectiveSystemId && rankId)
                mutation.mutate({
                  memberId,
                  systemId: effectiveSystemId,
                  rankId,
                  awardedOn,
                  notes: notes || undefined,
                });
            }}
          >
            <DialogPanel className="grid gap-4">
              <Field>
                <FieldLabel>System</FieldLabel>
                <Select
                  disabled={Boolean(editingAward)}
                  items={available.map((item) => ({ value: item.id, label: item.name }))}
                  onValueChange={(value) => {
                    setSystemId(String(value));
                    setRankId("");
                  }}
                  value={effectiveSystemId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {available.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Graduierung</FieldLabel>
                <Select
                  disabled={Boolean(editingAward)}
                  items={(selectedSystem?.ranks ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onValueChange={(value) => setRankId(String(value))}
                  value={rankId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Graduierung auswählen" />
                  </SelectTrigger>
                  <SelectPopup>
                    {selectedSystem?.ranks.map((rank) => (
                      <SelectItem key={rank.id} value={rank.id}>
                        {rank.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Verliehen am</FieldLabel>
                <Input
                  name="awarded-on"
                  onChange={(event) => setAwardedOn(event.target.value)}
                  type="date"
                  value={awardedOn}
                />
              </Field>
              <Field>
                <FieldLabel>Notiz</FieldLabel>
                <Textarea
                  name="award-notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional…"
                  value={notes}
                />
              </Field>
            </DialogPanel>
            <DialogFooter className="sm:flex-wrap">
              {editingAward ? (
                <Button
                  className="sm:mr-auto"
                  onClick={() => setDeleteOpen(true)}
                  type="button"
                  variant="destructive-outline"
                >
                  <Trash2Icon /> Graduierung entfernen
                </Button>
              ) : null}
              <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
              <Button loading={mutation.isPending || updateMutation.isPending} type="submit">
                {editingAward ? "Datum speichern" : "Graduierung verleihen"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>
      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Graduierung entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{editingAward?.rank.name}“ wird aus dem Fortschritt dieses Mitglieds entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              loading={deleteMutation.isPending}
              onClick={() =>
                editingAward && deleteMutation.mutate({ awardId: editingAward.award.id })
              }
              variant="destructive"
            >
              Graduierung entfernen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
