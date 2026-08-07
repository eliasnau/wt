import { Button } from "@matdesk/ui/components/button";
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
import { CardFrame } from "@matdesk/ui/components/card";
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
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import { Popover, PopoverPopup, PopoverTrigger } from "@matdesk/ui/components/popover";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@matdesk/ui/components/tabs";
import { cn } from "@matdesk/ui/lib/utils";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  ArrowLeftIcon,
  AwardIcon,
  GripVerticalIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ProgressionFlow } from "@/components/dashboard/progression/progression-flow";
import { SystemDialog } from "@/components/dashboard/progression/system-dialog";
import { UserAvatar } from "@/components/auth/user-avatar";
import {
  progressionSystemsQueryOptions,
  rankMembersQueryOptions,
} from "@/queries/progression";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/progression/$systemId")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(progressionSystemsQueryOptions());
  },
  pendingComponent: () => <Skeleton className="h-72 rounded-2xl" />,
  component: RouteComponent,
});

const COLOR_PRESETS = [
  "#ffffff",
  "#facc15",
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#7c3aed",
  "#a16207",
  "#ef4444",
  "#000000",
];

function RouteComponent() {
  const { systemId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const systemsQuery = useQuery(progressionSystemsQueryOptions());
  const system = systemsQuery.data?.find((item) => item.id === systemId);
  const [rankIds, setRankIds] = useState<string[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [systemDialogOpen, setSystemDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRankId, setSelectedRankId] = useState<string | null>(null);
  const [editingRank, setEditingRank] = useState<{
    id: string;
    name: string;
    color: string | null;
  } | null>(null);
  const rankMembersQuery = useQuery({
    ...rankMembersQueryOptions(selectedRankId ?? ""),
    enabled: selectedRankId !== null,
  });
  const invalidateProgression = () =>
    queryClient.invalidateQueries({ queryKey: progressionSystemsQueryOptions().queryKey });

  useEffect(() => {
    if (system) setRankIds(system.ranks.map((rank) => rank.id));
  }, [system]);

  const reorder = useMutation(
    orpc.progression.reorderRanks.mutationOptions({
      onSuccess: invalidateProgression,
      onError: (error) => {
        toast.error(parseError(error).message);
        if (system) setRankIds(system.ranks.map((rank) => rank.id));
      },
    }),
  );
  const deleteRank = useMutation(
    orpc.progression.deleteRank.mutationOptions({
      onSuccess: () => {
        invalidateProgression();
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const updateRankColor = useMutation(
    orpc.progression.updateRank.mutationOptions({
      onMutate: async ({ rankId, color }) => {
        const query = progressionSystemsQueryOptions();
        await queryClient.cancelQueries({ queryKey: query.queryKey });

        const previousSystems = queryClient.getQueryData(query.queryKey);
        queryClient.setQueryData(query.queryKey, (systems) =>
          systems?.map((item) => ({
            ...item,
            ranks: item.ranks.map((rank) =>
              rank.id === rankId ? { ...rank, color: color ?? null } : rank,
            ),
          })),
        );

        return { previousSystems };
      },
      onError: (error, _variables, context) => {
        if (context?.previousSystems) {
          queryClient.setQueryData(
            progressionSystemsQueryOptions().queryKey,
            context.previousSystems,
          );
        }
        toast.error(parseError(error).message);
      },
      onSettled: invalidateProgression,
    }),
  );
  const deleteSystem = useMutation(
    orpc.progression.deleteSystem.mutationOptions({
      onSuccess: () => {
        toast.success("Graduierungssystem gelöscht");
        invalidateProgression();
        navigate({ to: "/dashboard/progression" });
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  function finishDrag(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = rankIds.indexOf(String(event.active.id));
    const newIndex = rankIds.indexOf(String(event.over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rankIds, oldIndex, newIndex);
    setRankIds(next);
    reorder.mutate({ systemId, rankIds: next });
  }

  if (systemsQuery.isPending) return <Skeleton className="h-72 rounded-2xl" />;
  if (systemsQuery.isError)
    return (
      <CardFrame className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted-foreground text-sm">
          {parseError(systemsQuery.error).message}
        </p>
        <Button onClick={() => systemsQuery.refetch()} size="sm" variant="outline">
          Erneut versuchen
        </Button>
      </CardFrame>
    );
  if (!system)
    return (
      <div className="py-20 text-center text-muted-foreground">
        Graduierungssystem nicht gefunden.
      </div>
    );

  const rankById = new Map(system.ranks.map((rank) => [rank.id, rank]));
  const orderedRanks = rankIds.map((id) => rankById.get(id)).filter((rank) => rank !== undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button render={<Link to="/dashboard/progression" />} size="sm" variant="ghost">
          <ArrowLeftIcon /> Graduierungen
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-balance font-semibold text-2xl tracking-tight">{system.name}</h1>
            <Badge variant="secondary">
              {system.mode === "sequential" ? "Aufeinanderfolgend" : "Sammlung"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setEditingRank(null);
              setDialogOpen(true);
            }}
            size="sm"
          >
            <PlusIcon /> {system.unitLabel} hinzufügen
          </Button>
          <Button
            aria-label="System bearbeiten"
            onClick={() => setSystemDialogOpen(true)}
            size="icon-sm"
            title="System bearbeiten"
            variant="outline"
          >
            <PencilIcon />
          </Button>
          <Button
            aria-label="System löschen"
            onClick={() => setDeleteOpen(true)}
            size="icon-sm"
            title="System löschen"
            variant="destructive-outline"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="nodes">
        <TabsList variant="underline">
          <TabsTab value="nodes">
            <WorkflowIcon /> Übersicht
          </TabsTab>
          <TabsTab value="list">
            <ListIcon /> Liste
          </TabsTab>
        </TabsList>

        <TabsPanel className="pt-2" value="list">
          <CardFrame className="w-full min-w-0 overflow-hidden">
            <DndContext collisionDetection={closestCenter} onDragEnd={finishDrag} sensors={sensors}>
              <Table className="min-w-[680px]" variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Reihenfolge</TableHead>
                    <TableHead>Graduierung</TableHead>
                    <TableHead>Farbe</TableHead>
                    <TableHead>Mitglieder</TableHead>
                    <TableHead className="w-px" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedRanks.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="p-0" colSpan={6}>
                        <Empty className="py-14">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <AwardIcon />
                            </EmptyMedia>
                            <EmptyTitle>Noch keine {system.unitLabel.toLowerCase()}en</EmptyTitle>
                            <EmptyDescription>
                              Füge die erste Stufe zu diesem System hinzu.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext items={rankIds} strategy={verticalListSortingStrategy}>
                      {orderedRanks.map((rank, index) => (
                        <SortableRankRow
                          index={index}
                          key={rank.id}
                          onDelete={() => deleteRank.mutate({ rankId: rank.id })}
                          onColorChange={(color) =>
                            updateRankColor.mutate({ rankId: rank.id, color })
                          }
                          onEdit={() => {
                            setEditingRank(rank);
                            setDialogOpen(true);
                          }}
                          rank={rank}
                        />
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </CardFrame>
        </TabsPanel>

        <TabsPanel className="pt-2" value="nodes">
          <ProgressionFlow
            onRankClick={setSelectedRankId}
            onRankHover={(rankId) => {
              void queryClient.prefetchQuery(rankMembersQueryOptions(rankId));
            }}
            system={system}
          />
        </TabsPanel>
      </Tabs>

      <RankDialog
        open={dialogOpen}
        rank={editingRank}
        systemId={systemId}
        unitLabel={system.unitLabel}
        onOpenChange={setDialogOpen}
      />
      <SystemDialog onOpenChange={setSystemDialogOpen} open={systemDialogOpen} system={system} />
      <Sheet
        onOpenChange={(open) => {
          if (!open) setSelectedRankId(null);
        }}
        open={selectedRankId !== null}
      >
        <SheetPopup className="max-w-md">
          <SheetHeader>
            <SheetTitle>
              {system.ranks.find((rank) => rank.id === selectedRankId)?.name ?? "Mitglieder"}
            </SheetTitle>
            <SheetDescription>
              {rankMembersQuery.data?.length ?? 0} Mitglieder mit dieser Graduierung.
            </SheetDescription>
          </SheetHeader>
          <SheetPanel>
            {rankMembersQuery.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton className="h-16 w-full rounded-lg" key={index} />
                ))}
              </div>
            ) : rankMembersQuery.data?.length ? (
              <div className="space-y-2">
                {rankMembersQuery.data.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`;
                  return (
                    <Link
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                      key={member.id}
                      params={{ memberId: member.id }}
                      to="/dashboard/members/$memberId"
                    >
                      <UserAvatar className="size-9" name={name} seed={member.id} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{name}</p>
                        <p className="text-muted-foreground text-xs">
                          Verliehen am {new Intl.DateTimeFormat("de-DE").format(new Date(member.awardedOn))}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>Noch keine Mitglieder</EmptyTitle>
                  <EmptyDescription>Diese Graduierung wurde noch nicht verliehen.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </SheetPanel>
        </SheetPopup>
      </Sheet>
      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Graduierungssystem löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{system.name}“ und alle noch nicht verliehenen Stufen werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              loading={deleteSystem.isPending}
              onClick={() => deleteSystem.mutate({ systemId })}
              variant="destructive"
            >
              System löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}

function SortableRankRow({
  rank,
  index,
  onEdit,
  onDelete,
  onColorChange,
}: {
  rank: { id: string; name: string; color: string | null; memberCount: number };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onColorChange: (color: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rank.id,
  });

  return (
    <TableRow
      className={cn(
        "relative bg-card transition-[background-color,box-shadow]",
        isDragging &&
          "z-10 bg-accent shadow-lg [&>td]:border-y [&>td:first-child]:border-l [&>td:last-child]:border-r",
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TableCell>
        <button
          aria-label={`${rank.name} verschieben`}
          className="flex size-6 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
      <TableCell className="font-medium text-foreground">{rank.name}</TableCell>
      <TableCell>
        <RankColorPopover color={rank.color} name={rank.name} onChange={onColorChange} />
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          <UsersIcon /> {rank.memberCount}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button aria-label="Bearbeiten" onClick={onEdit} size="icon-sm" variant="ghost">
            <PencilIcon />
          </Button>
          <Button aria-label="Löschen" onClick={onDelete} size="icon-sm" variant="ghost">
            <Trash2Icon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function RankColorPopover({
  color,
  name,
  onChange,
}: {
  color: string | null;
  name: string;
  onChange: (color: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  function selectColor(nextColor: string | null) {
    onChange(nextColor);
    setOpen(false);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label={`Farbe für ${name} ändern`}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden="true"
          className="flex size-5 items-center justify-center rounded-full border bg-black text-white shadow-xs"
          style={color ? { backgroundColor: color } : undefined}
        >
          {color ? null : <XIcon className="size-3" />}
        </span>
        <span className="font-mono text-muted-foreground text-xs">{color ?? "Keine"}</span>
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-64">
        <p className="mb-3 font-medium text-sm">Farbe auswählen</p>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              aria-label={`Farbe ${preset}`}
              className={cn(
                "size-8 rounded-full border shadow-xs transition-transform hover:scale-105",
                color === preset && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
              )}
              key={preset}
              onClick={() => selectColor(preset)}
              style={{ backgroundColor: preset }}
              type="button"
            />
          ))}
          <button
            aria-label="Farbe entfernen"
            className={cn(
              "flex size-8 items-center justify-center rounded-full border bg-black text-white hover:bg-black/80",
              color === null && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
            )}
            onClick={() => selectColor(null)}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <label className="relative mt-4 flex cursor-pointer items-center gap-3 rounded-md border-t px-1 py-2 pt-3 text-sm hover:bg-muted">
          <span
            aria-hidden="true"
            className="size-7 rounded-full border shadow-xs"
            style={{ backgroundColor: color ?? "#ffffff" }}
          />
          <span className="flex-1">Eigene Farbe auswählen</span>
          <span className="font-mono text-muted-foreground text-xs">{color ?? "#ffffff"}</span>
          <Input
            aria-label="Eigene Farbe auswählen"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            onChange={(event) => selectColor(event.target.value)}
            type="color"
            value={color ?? "#ffffff"}
          />
        </label>
      </PopoverPopup>
    </Popover>
  );
}

function RankDialog({
  open,
  rank,
  systemId,
  unitLabel,
  onOpenChange,
}: {
  open: boolean;
  rank: { id: string; name: string; color: string | null } | null;
  systemId: string;
  unitLabel: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!open) return;
    setName(rank?.name ?? "");
    setColor(rank?.color ?? null);
  }, [open, rank]);
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: orpc.progression.key() });
    onOpenChange(false);
  };
  const create = useMutation(
    orpc.progression.createRank.mutationOptions({
      onSuccess: done,
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const update = useMutation(
    orpc.progression.updateRank.mutationOptions({
      onSuccess: done,
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{rank ? `${unitLabel} bearbeiten` : `${unitLabel} hinzufügen`}</DialogTitle>
          <DialogDescription>Name und Farbe der Graduierung.</DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            if (rank) update.mutate({ rankId: rank.id, name, color });
            else create.mutate({ systemId, name, color });
          }}
        >
          <DialogPanel className="grid gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                autoFocus
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. Weißgurt"
                value={name}
              />
            </Field>
            <Field>
              <FieldLabel>Farbe</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    aria-label={`Farbe ${preset}`}
                    className={cn(
                      "size-8 rounded-full border shadow-xs transition-transform hover:scale-105",
                      color === preset && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                    key={preset}
                    onClick={() => setColor(preset)}
                    style={{ backgroundColor: preset }}
                    type="button"
                  />
                ))}
                <button
                  aria-label="Keine Farbe"
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border bg-black text-white hover:bg-black/80",
                    color === null && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                  onClick={() => setColor(null)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <label className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border hover:bg-muted">
                  <span
                    aria-hidden="true"
                    className="size-6 rounded-full border shadow-xs"
                    style={{ backgroundColor: color ?? "#ffffff" }}
                  />
                  <Input
                    aria-label="Eigene Farbe auswählen"
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    onChange={(event) => setColor(event.target.value)}
                    type="color"
                    value={color ?? "#ffffff"}
                  />
                </label>
                <Input
                  className="font-mono"
                  onChange={(event) => setColor(event.target.value || null)}
                  placeholder="Keine Farbe"
                  value={color ?? ""}
                />
              </div>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button
              disabled={!name.trim()}
              loading={create.isPending || update.isPending}
              type="submit"
            >
              {rank ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
