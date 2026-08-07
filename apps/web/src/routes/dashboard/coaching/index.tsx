import { Badge } from "@matdesk/ui/components/badge";
import { Button } from "@matdesk/ui/components/button";
import { CardFrame } from "@matdesk/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@matdesk/ui/components/input-group";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuTrigger,
} from "@matdesk/ui/components/menu";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@matdesk/ui/components/sheet";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@matdesk/ui/components/table";
import { Tabs, TabsList, TabsTab } from "@matdesk/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parseError } from "evlog";
import {
  CalendarCheckIcon,
  CheckIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/auth/user-avatar";
import { CoachingDialog, type CoachingRow } from "@/components/dashboard/coaching/coaching-dialog";
import { coachingListQueryOptions } from "@/queries/coaching";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/coaching/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(coachingListQueryOptions());
  },
  pendingComponent: () => <Skeleton className="h-96 rounded-2xl" />,
  component: CoachingPage,
});

const statusLabels: Record<string, string> = {
  scheduled: "Geplant",
  attended: "Teilgenommen",
  no_show: "Nicht erschienen",
  cancelled: "Abgesagt",
};
const paymentLabels: Record<string, string> = {
  open: "Offen",
  paid: "Bezahlt",
  waived: "Erlassen",
};
const money = (cents: number | null) =>
  cents == null
    ? "—"
    : (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const day = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function CoachingPage() {
  const query = useQuery(coachingListQueryOptions());
  const [tab, setTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [paymentFilters, setPaymentFilters] = useState(new Set(["open", "paid", "waived"]));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CoachingRow | null>(null);
  const [editing, setEditing] = useState<CoachingRow | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((row) => {
        const tabMatches =
          tab === "all" ||
          (tab === "open"
            ? row.date < today && row.status === "scheduled"
            : row.date >= today && row.status === "scheduled");
        const haystack = [
          row.coach.name,
          row.location,
          ...row.participants.map((item) =>
            item.member ? `${item.member.firstName} ${item.member.lastName}` : item.guestName,
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("de-DE");
        return (
          tabMatches &&
          paymentFilters.has(row.paymentStatus) &&
          haystack.includes(search.trim().toLocaleLowerCase("de-DE"))
        );
      }),
    [paymentFilters, query.data, search, tab, today],
  );
  const selectedAppointment = (query.data ?? []).find((row) => row.id === selected?.id) ?? selected;

  function edit(row: CoachingRow | null) {
    setEditing(row);
    setDialogOpen(true);
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Einzelcoaching</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Termine, Anwesenheit, Preise und Zahlungen verwalten.
          </p>
        </div>
        <Button onClick={() => edit(null)}>
          <PlusIcon />
          Coaching anlegen
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <InputGroup className="w-full sm:w-72">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Coachings suchen…"
              value={search}
            />
          </InputGroup>
          <Menu>
            <MenuTrigger render={<Button variant="outline" />}>
              <SlidersHorizontalIcon /> Filter
              {paymentFilters.size < 3 ? (
                <span className="rounded bg-primary/10 px-1.5 text-primary text-xs">
                  {paymentFilters.size}
                </span>
              ) : null}
            </MenuTrigger>
            <MenuPopup align="start" className="w-48">
              <MenuGroup>
                <MenuGroupLabel>Zahlungsstatus</MenuGroupLabel>
                {Object.entries(paymentLabels).map(([value, label]) => (
                  <MenuCheckboxItem
                    checked={paymentFilters.has(value)}
                    closeOnClick={false}
                    key={value}
                    onCheckedChange={() =>
                      setPaymentFilters((current) => {
                        const next = new Set(current);
                        if (next.has(value)) next.delete(value);
                        else next.add(value);
                        return next;
                      })
                    }
                  >
                    {label}
                  </MenuCheckboxItem>
                ))}
              </MenuGroup>
            </MenuPopup>
          </Menu>
        </div>
        <Tabs onValueChange={(value) => setTab(String(value))} value={tab}>
          <TabsList>
            <TabsTab value="upcoming">Kommende</TabsTab>
            <TabsTab value="open">Ohne Ergebnis</TabsTab>
            <TabsTab value="all">Alle</TabsTab>
          </TabsList>
        </Tabs>
      </div>
      <CardFrame className="min-w-0 overflow-hidden">
        <Table className="min-w-[820px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Termin</TableHead>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Zahlung</TableHead>
              <TableHead>Preis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-14 text-center" colSpan={6}>
                  <p className="mb-3 text-muted-foreground text-sm">
                    {parseError(query.error).message}
                  </p>
                  <Button onClick={() => query.refetch()} size="sm" variant="outline">
                    Erneut versuchen
                  </Button>
                </TableCell>
              </TableRow>
            ) : query.isPending ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell className="p-0" colSpan={6}>
                  <Empty className="py-14">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarCheckIcon />
                      </EmptyMedia>
                      <EmptyTitle>Keine Coachings</EmptyTitle>
                      <EmptyDescription>Lege den ersten Coaching-Termin an.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow className="cursor-pointer" key={row.id} onClick={() => setSelected(row)}>
                  <TableCell>
                    <div className="font-medium">{day(row.date)}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.startTime.slice(0, 5)}–{row.endTime.slice(0, 5)} Uhr
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex shrink-0 -space-x-2">
                        {row.participants.map((item) => (
                          <UserAvatar
                            className="size-8 border-2 border-background"
                            key={item.id}
                            name={
                              item.member
                                ? `${item.member.firstName} ${item.member.lastName}`
                                : (item.guestName ?? "Gast")
                            }
                            seed={item.memberId ?? item.id}
                          />
                        ))}
                      </div>
                      <span className="max-w-52 truncate font-medium">
                        {row.participants
                          .map((item) =>
                            item.member
                              ? `${item.member.firstName} ${item.member.lastName}`
                              : item.guestName,
                          )
                          .join(", ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.coach.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "attended"
                          ? "success"
                          : row.status === "cancelled"
                            ? "secondary"
                            : row.status === "no_show"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {statusLabels[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.paymentStatus === "paid"
                          ? "success"
                          : row.paymentStatus === "waived"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {paymentLabels[row.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>{money(row.priceCents)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardFrame>
      <CoachingDialog appointment={editing} onOpenChange={setDialogOpen} open={dialogOpen} />
      <CoachingSheet
        appointment={selectedAppointment}
        onEdit={() => {
          if (selectedAppointment) edit(selectedAppointment);
        }}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function CoachingSheet({
  appointment,
  onOpenChange,
  onEdit,
}: {
  appointment: CoachingRow | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const state = useMutation(
    orpc.coaching.setState.mutationOptions({
      onMutate: async ({ appointmentId, status, paymentStatus }) => {
        const listQuery = coachingListQueryOptions();
        await queryClient.cancelQueries({ queryKey: listQuery.queryKey });

        const previousAppointments = queryClient.getQueryData(listQuery.queryKey);
        queryClient.setQueryData(listQuery.queryKey, (appointments) =>
          appointments?.map((item) =>
            item.id === appointmentId
              ? {
                  ...item,
                  ...(status === undefined ? {} : { status }),
                  ...(paymentStatus === undefined ? {} : { paymentStatus }),
                }
              : item,
          ),
        );

        return { previousAppointments };
      },
      onError: (error, _variables, context) => {
        if (context?.previousAppointments) {
          queryClient.setQueryData(
            coachingListQueryOptions().queryKey,
            context.previousAppointments,
          );
        }
        toast.error(parseError(error).message);
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: coachingListQueryOptions().queryKey });
      },
    }),
  );
  if (!appointment) return <Sheet onOpenChange={onOpenChange} open={false} />;
  const update = (patch: {
    status?: "scheduled" | "attended" | "no_show" | "cancelled";
    paymentStatus?: "open" | "paid" | "waived";
  }) => state.mutate({ appointmentId: appointment.id, ...patch });
  return (
    <Sheet onOpenChange={onOpenChange} open>
      <SheetPopup className="max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {day(appointment.date)} · {appointment.startTime.slice(0, 5)} Uhr
          </SheetTitle>
          <SheetDescription>
            Coaching mit {appointment.participants.length} Teilnehmer
            {appointment.participants.length === 1 ? "" : "n"}.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Info
              icon={<ClockIcon />}
              label="Zeit"
              value={`${appointment.startTime.slice(0, 5)}–${appointment.endTime.slice(0, 5)} Uhr`}
            />
            <Info icon={<UserRoundIcon />} label="Trainer" value={appointment.coach.name} />
            <Info label="Preis" value={money(appointment.priceCents)} />
            <Info label="Zahlung" value={paymentLabels[appointment.paymentStatus]} />
          </div>
          <section>
            <h3 className="mb-2 font-medium">Teilnehmer</h3>
            <div className="space-y-2">
              {appointment.participants.map((item) => {
                const name = item.member
                  ? `${item.member.firstName} ${item.member.lastName}`
                  : (item.guestName ?? "Gast");
                return item.member ? (
                  <Link
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted"
                    key={item.id}
                    params={{ memberId: item.member.id }}
                    to="/dashboard/members/$memberId"
                  >
                    <UserAvatar className="size-8" name={name} seed={item.member.id} />
                    <span className="font-medium">{name}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border p-3" key={item.id}>
                    <UserAvatar className="size-8" name={name} seed={item.id} />
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-muted-foreground text-xs">Gast</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h3 className="mb-2 font-medium">Anwesenheit</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => update({ status: "attended" })}
                variant={appointment.status === "attended" ? "default" : "outline"}
              >
                <CheckIcon />
                Teilgenommen
              </Button>
              <Button
                onClick={() => update({ status: "no_show" })}
                variant={appointment.status === "no_show" ? "destructive" : "outline"}
              >
                <XIcon />
                Nicht erschienen
              </Button>
            </div>
          </section>
          <section>
            <h3 className="mb-2 font-medium">Zahlungsstatus</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => update({ paymentStatus: "open" })}
                size="sm"
                variant={appointment.paymentStatus === "open" ? "default" : "outline"}
              >
                Offen
              </Button>
              <Button
                onClick={() => update({ paymentStatus: "paid" })}
                size="sm"
                variant={appointment.paymentStatus === "paid" ? "default" : "outline"}
              >
                Bezahlt
              </Button>
              <Button
                onClick={() => update({ paymentStatus: "waived" })}
                size="sm"
                variant={appointment.paymentStatus === "waived" ? "default" : "outline"}
              >
                Erlassen
              </Button>
            </div>
          </section>
          {appointment.notes ? (
            <section>
              <h3 className="mb-1 font-medium">Notizen</h3>
              <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                {appointment.notes}
              </p>
            </section>
          ) : null}
        </SheetPanel>
        <SheetFooter>
          <Button onClick={() => update({ status: "cancelled" })} variant="destructive-outline">
            Absagen
          </Button>
          <Button onClick={onEdit} variant="outline">
            <PencilIcon />
            Bearbeiten
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </div>
  );
}
