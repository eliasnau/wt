import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { Card, CardFrame } from "@matdesk/ui/components/card";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@matdesk/ui/components/combobox";
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
import { Input } from "@matdesk/ui/components/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@matdesk/ui/components/menu";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@matdesk/ui/components/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDashedIcon,
  ClockIcon,
  EditIcon,
  EuroIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  UserRoundIcon,
  UserRoundPlusIcon,
  UserXIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/auth/user-avatar";
import { EventDialog, type EventRow } from "@/components/dashboard/events/event-dialog";
import { eventDetailQueryOptions, eventsListQueryOptions } from "@/queries/events";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/events/$eventId")({
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(eventDetailQueryOptions(params.eventId));
  },
  pendingComponent: () => <Skeleton className="h-96 rounded-2xl" />,
  component: RouteComponent,
});

const STATUS_META = {
  registered: {
    label: "Angemeldet",
    icon: CircleDashedIcon,
    variant: "info" as const,
  },
  attended: {
    label: "Teilgenommen",
    icon: CheckCircle2Icon,
    variant: "success" as const,
  },
  no_show: {
    label: "Nicht erschienen",
    icon: UserXIcon,
    variant: "warning" as const,
  },
  cancelled: {
    label: "Abgesagt",
    icon: XCircleIcon,
    variant: "secondary" as const,
  },
};

type ParticipantStatus = keyof typeof STATUS_META;
type EventData = Awaited<ReturnType<typeof client.events.get>>;
type MemberSearchRow = Awaited<ReturnType<typeof client.members.list>>["data"][number];

function RouteComponent() {
  const { eventId } = Route.useParams();
  const eventQuery = useQuery(eventDetailQueryOptions(eventId));
  const [editorOpen, setEditorOpen] = useState(false);

  if (eventQuery.isError) {
    return (
      <CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">{parseError(eventQuery.error).message}</p>
        <Button onClick={() => eventQuery.refetch()} variant="outline">
          Erneut versuchen
        </Button>
      </CardFrame>
    );
  }

  const event = eventQuery.data;
  return (
    <div className="flex flex-col gap-6">
      <Button
        className="-ml-2 self-start text-muted-foreground"
        render={<Link to="/dashboard/events" />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon />
        Zurück zu Veranstaltungen
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {event ? (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
              <Badge variant="outline">
                {event.participants.filter((p) => p.status !== "cancelled").length}
                {event.capacity == null ? "" : ` / ${event.capacity}`} Plätze
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-20" />
            </div>
          )}
          {event ? (
            event.description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{event.description}</p>
            ) : null
          ) : (
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          )}
        </div>
        <Button disabled={!event} onClick={() => setEditorOpen(true)} variant="outline">
          <EditIcon />
          Bearbeiten
        </Button>
      </div>

      <EventSummary event={event} />
      <ParticipantsSection event={event} eventId={eventId} />
      {event ? (
        <EventDialog event={event as EventRow} onOpenChange={setEditorOpen} open={editorOpen} />
      ) : null}
    </div>
  );
}

function EventSummary({ event }: { event: EventData | undefined }) {
  const items = [
    {
      icon: CalendarDaysIcon,
      label: "Datum",
      skeletonWidth: "w-40",
      value: event
        ? new Date(`${event.date}T12:00:00`).toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : null,
    },
    {
      icon: ClockIcon,
      label: "Uhrzeit",
      skeletonWidth: "w-28",
      value: event
        ? event.startTime
          ? `${event.startTime.slice(0, 5)}–${event.endTime?.slice(0, 5)} Uhr`
          : "Ganztägig"
        : null,
    },
    {
      icon: MapPinIcon,
      label: "Ort",
      skeletonWidth: "w-32",
      value: event ? event.location || "Nicht angegeben" : null,
    },
    {
      icon: EuroIcon,
      label: "Preis",
      skeletonWidth: "w-20",
      value: event
        ? event.priceCents == null
          ? "Kostenlos / offen"
          : (event.priceCents / 100).toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
            })
        : null,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4 text-foreground">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
              <item.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground/70">{item.label}</p>
              {item.value == null ? (
                <Skeleton className={`mt-1.5 h-4 max-w-full ${item.skeletonWidth}`} />
              ) : (
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ParticipantsSection({
  event,
  eventId,
}: {
  event: EventData | undefined;
  eventId: string;
}) {
  const queryClient = useQueryClient();
  const [participantSearch, setParticipantSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const activeCount =
    event?.participants.filter((participant) => participant.status !== "cancelled").length ?? 0;
  const full = event != null && event.capacity != null && activeCount >= event.capacity;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: eventDetailQueryOptions(eventId).queryKey });
    void queryClient.invalidateQueries({ queryKey: eventsListQueryOptions().queryKey });
  }
  const addMutation = useMutation(
    orpc.events.addParticipant.mutationOptions({
      onSuccess: () => {
        setAddOpen(false);
        refresh();
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const updateMutation = useMutation(
    orpc.events.updateParticipant.mutationOptions({
      onMutate: async ({ participantId, status }) => {
        const query = eventDetailQueryOptions(eventId);
        await queryClient.cancelQueries({ queryKey: query.queryKey });

        const previousEvent = queryClient.getQueryData(query.queryKey);
        queryClient.setQueryData(query.queryKey, (currentEvent) =>
          currentEvent
            ? {
                ...currentEvent,
                participants: currentEvent.participants.map((participant) =>
                  participant.id === participantId ? { ...participant, status } : participant,
                ),
              }
            : currentEvent,
        );

        return { previousEvent };
      },
      onError: (error, _variables, context) => {
        if (context?.previousEvent) {
          queryClient.setQueryData(
            eventDetailQueryOptions(eventId).queryKey,
            context.previousEvent,
          );
        }
        toast.error(parseError(error).message);
      },
      onSettled: refresh,
    }),
  );
  const removeMutation = useMutation(
    orpc.events.removeParticipant.mutationOptions({
      onSuccess: () => {
        refresh();
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  const search = participantSearch.trim().toLowerCase();
  const allParticipants = event?.participants ?? [];
  const participants = search
    ? allParticipants.filter((participant) => {
        const name = participant.member
          ? `${participant.member.firstName} ${participant.member.lastName}`
          : participant.guestName;
        return name?.toLowerCase().includes(search);
      })
    : allParticipants;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Teilnehmer</h2>
          <p className="mt-0.5 text-sm text-foreground/70">
            Mitglieder suchen, Gäste ergänzen und Anwesenheit festhalten.
          </p>
        </div>
        <Button disabled={!event || full} onClick={() => setAddOpen(true)}>
          <UserRoundPlusIcon />
          Teilnehmer hinzufügen
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            disabled={!event}
            onChange={(e) => setParticipantSearch(e.target.value)}
            placeholder="Teilnehmer suchen…"
            value={participantSearch}
          />
        </div>
        {event ? (
          <div className="flex gap-2 text-sm text-foreground/70">
            <span>{activeCount} aktiv</span>
            <span>·</span>
            <span>
              {allParticipants.filter((p) => p.status === "attended").length} teilgenommen
            </span>
          </div>
        ) : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>

      <CardFrame className="w-full min-w-0 overflow-hidden">
        <Table className="min-w-[720px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!event ? (
              Array.from({ length: 5 }).map((_, index) => <ParticipantRowSkeleton key={index} />)
            ) : participants.length ? (
              participants.map((participant) => {
                const member = participant.member;
                const name = member
                  ? `${member.firstName} ${member.lastName}`
                  : participant.guestName;
                const status = STATUS_META[participant.status as ParticipantStatus];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member ? (
                          <UserAvatar
                            className="size-8"
                            name={name ?? undefined}
                            seed={member.id}
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <UserRoundIcon className="size-4" />
                          </div>
                        )}
                        <div>
                          {member ? (
                            <Link
                              className="font-medium hover:underline"
                              params={{ memberId: member.id }}
                              to="/dashboard/members/$memberId"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-medium">{name}</span>
                          )}
                          <div className="mt-0.5">
                            {member ? (
                              <span className="text-xs text-muted-foreground">Mitglied</span>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300"
                              >
                                Gast
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground/70">
                      {member?.email ? (
                        <a
                          className="inline-flex items-center gap-1.5 hover:text-foreground"
                          href={`mailto:${member.email}`}
                        >
                          <MailIcon className="size-3.5" />
                          {member.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Menu>
                        <MenuTrigger render={<Button size="sm" variant="ghost" />}>
                          <Badge variant={status.variant}>
                            <StatusIcon />
                            {status.label}
                          </Badge>
                          <ChevronDownIcon />
                        </MenuTrigger>
                        <MenuPopup align="start">
                          {Object.entries(STATUS_META).map(([value, meta]) => {
                            const Icon = meta.icon;
                            return (
                              <MenuItem
                                key={value}
                                onClick={() =>
                                  updateMutation.mutate({
                                    participantId: participant.id,
                                    status: value as ParticipantStatus,
                                  })
                                }
                              >
                                <Icon />
                                {meta.label}
                              </MenuItem>
                            );
                          })}
                        </MenuPopup>
                      </Menu>
                    </TableCell>
                    <TableCell>
                      <Button
                        aria-label={`${name} entfernen`}
                        onClick={() =>
                          removeMutation.mutate({
                            participantId: participant.id,
                          })
                        }
                        size="icon-sm"
                        variant="ghost"
                      >
                        <XIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="h-28 text-center text-foreground/70" colSpan={4}>
                  {search ? "Keine Teilnehmer gefunden" : "Noch keine Teilnehmer"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardFrame>

      <AddParticipantDialog
        disabled={full}
        excludedIds={
          new Set(
            allParticipants
              .filter((participant) => participant.status !== "cancelled" && participant.memberId)
              .map((participant) => participant.memberId!),
          )
        }
        loading={addMutation.isPending}
        onAddGuest={(guestName) => addMutation.mutate({ eventId, guestName })}
        onAddMember={(memberId) => addMutation.mutate({ eventId, memberId })}
        onOpenChange={setAddOpen}
        open={addOpen}
      />
    </section>
  );
}

function AddParticipantDialog({
  open,
  onOpenChange,
  excludedIds,
  disabled,
  loading,
  onAddMember,
  onAddGuest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludedIds: Set<string>;
  disabled: boolean;
  loading: boolean;
  onAddMember: (memberId: string) => void;
  onAddGuest: (guestName: string) => void;
}) {
  const [guestName, setGuestName] = useState("");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Teilnehmer hinzufügen</DialogTitle>
          <DialogDescription>
            Wähle ein bestehendes Mitglied oder erfasse einen Gast.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Tabs defaultValue="member">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTab value="member">
                <UserRoundIcon />
                Mitglied
              </TabsTab>
              <TabsTab value="guest">
                <UserRoundPlusIcon />
                Gast
              </TabsTab>
            </TabsList>
            <TabsPanel className="pt-4" value="member">
              <p className="mb-2 text-sm font-medium text-foreground">Mitglied suchen</p>
              <MemberSearch
                disabled={disabled || loading}
                excludedIds={excludedIds}
                onSelect={onAddMember}
              />
              <p className="mt-2 text-xs text-foreground/60">
                Suche nach Name, E-Mail-Adresse oder Telefonnummer.
              </p>
            </TabsPanel>
            <TabsPanel className="pt-4" value="guest">
              <p className="mb-2 text-sm font-medium text-foreground">Name des Gastes</p>
              <Input
                autoFocus
                disabled={disabled || loading}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Vor- und Nachname"
                value={guestName}
              />
              <Button
                className="mt-3 w-full"
                disabled={disabled || !guestName.trim()}
                loading={loading}
                onClick={() => onAddGuest(guestName.trim())}
              >
                <UserRoundPlusIcon />
                Gast hinzufügen
              </Button>
            </TabsPanel>
          </Tabs>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function MemberSearch({
  excludedIds,
  disabled,
  onSelect,
}: {
  excludedIds: Set<string>;
  disabled: boolean;
  onSelect: (memberId: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue.trim()), 250);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const query = useQuery(
    orpc.members.list.queryOptions({
      input: {
        page: 1,
        limit: 20,
        search: search || undefined,
        options: { statuses: ["active", "cancelled_but_active"] },
      },
      enabled: search.length > 0,
    }),
  );
  const members = ((query.data?.data ?? []) as MemberSearchRow[]).filter(
    (member) => !excludedIds.has(member.id),
  );

  return (
    <Combobox<MemberSearchRow>
      disabled={disabled}
      inputValue={inputValue}
      items={members}
      itemToStringLabel={(member) => `${member.firstName} ${member.lastName}`}
      onInputValueChange={setInputValue}
      onValueChange={(member) => {
        if (!member) return;
        onSelect(member.id);
        setInputValue("");
      }}
    >
      <ComboboxInput
        placeholder="Name, E-Mail oder Telefon suchen…"
        startAddon={query.isFetching ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
      />
      <ComboboxPopup>
        <ComboboxEmpty>{inputValue ? "Keine Mitglieder gefunden" : "Suche eingeben"}</ComboboxEmpty>
        <ComboboxList>
          {(member) => (
            <ComboboxItem key={member.id} value={member}>
              <div className="flex items-center gap-2.5 py-0.5">
                <UserAvatar
                  className="size-7"
                  name={`${member.firstName} ${member.lastName}`}
                  seed={member.id}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email || member.phone || "Keine Kontaktdaten"}
                  </p>
                </div>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

function ParticipantRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-44" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="size-7" />
      </TableCell>
    </TableRow>
  );
}
