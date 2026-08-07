"use client";

import { Button } from "@matdesk/ui/components/button";
import { Calendar } from "@matdesk/ui/components/calendar";
import { Checkbox } from "@matdesk/ui/components/checkbox";
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
import { Field, FieldLabel } from "@matdesk/ui/components/field";
import { Form } from "@matdesk/ui/components/form";
import { Input } from "@matdesk/ui/components/input";
import { Popover, PopoverPopup, PopoverTrigger } from "@matdesk/ui/components/popover";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@matdesk/ui/components/select";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@matdesk/ui/components/tabs";
import { Textarea } from "@matdesk/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { parseError } from "evlog";
import { CalendarIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { UserAvatar } from "@/components/auth/user-avatar";
import { client, orpc } from "@/utils/orpc";

type MemberRow = Awaited<ReturnType<typeof client.members.list>>["data"][number];
export type CoachingRow = Awaited<ReturnType<typeof client.coaching.list>>[number];

function dateFromYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

function ymdFromDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function CoachingDialog({
  open,
  onOpenChange,
  appointment,
  initialMemberId,
  initialMemberName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: CoachingRow | null;
  initialMemberId?: string;
  initialMemberName?: string;
}) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useAuth();
  const coaches = useMemo(
    () => activeOrganization?.members.map((item) => item.user) ?? [],
    [activeOrganization?.members],
  );
  const [coachUserId, setCoachUserId] = useState("");
  const [date, setDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"open" | "paid" | "waived">("open");
  const [notes, setNotes] = useState("");
  const [participant, setParticipant] = useState<{
    memberId?: string;
    name: string;
    guestEmail?: string;
    guestPhone?: string;
  } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [guestName, setGuestName] = useState("");
  const [allowConflict, setAllowConflict] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);
  const memberQuery = useQuery(
    orpc.members.list.queryOptions({
      input: { page: 1, limit: 20, search: search || undefined },
      enabled: search.length > 0,
    }),
  );

  useEffect(() => {
    if (!open) return;
    setCoachUserId(appointment?.coachUserId ?? coaches[0]?.id ?? "");
    setDate(appointment?.date ?? ymdFromDate(new Date()));
    setStartTime(appointment?.startTime.slice(0, 5) ?? "");
    setEndTime(appointment?.endTime.slice(0, 5) ?? "");
    setLocation(appointment?.location ?? "");
    setPrice(appointment?.priceCents == null ? "" : String(appointment.priceCents / 100));
    setPaymentStatus((appointment?.paymentStatus as typeof paymentStatus) ?? "open");
    setNotes(appointment?.notes ?? "");
    const existing = appointment?.participants[0];
    setParticipant(
      existing
        ? {
            memberId: existing.memberId ?? undefined,
            name: existing.member
              ? `${existing.member.firstName} ${existing.member.lastName}`
              : (existing.guestName ?? "Gast"),
            guestEmail: existing.guestEmail ?? undefined,
            guestPhone: existing.guestPhone ?? undefined,
          }
        : initialMemberId
          ? { memberId: initialMemberId, name: initialMemberName ?? "Ausgewähltes Mitglied" }
          : null,
    );
    setGuestName("");
    setAllowConflict(false);
  }, [appointment, coaches, initialMemberId, initialMemberName, open]);

  function done() {
    void queryClient.invalidateQueries({ queryKey: orpc.coaching.key() });
    onOpenChange(false);
  }
  const create = useMutation(
    orpc.coaching.create.mutationOptions({
      onSuccess: done,
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const update = useMutation(
    orpc.coaching.update.mutationOptions({
      onSuccess: done,
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const submit = () => {
    if (!participant) return;
    const values = {
      coachUserId,
      date,
      startTime,
      endTime,
      location: location || null,
      priceCents: price ? Math.round(Number(price) * 100) : null,
      paymentStatus,
      notes: notes || null,
      allowConflict,
      participants: [
        participant.memberId
          ? { memberId: participant.memberId }
          : {
              guestName: participant.name,
              guestEmail: participant.guestEmail,
              guestPhone: participant.guestPhone,
            },
      ],
    };
    if (appointment) update.mutate({ appointmentId: appointment.id, ...values });
    else create.mutate(values);
  };
  const valid = coachUserId && date && startTime && endTime > startTime && participant;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{appointment ? "Coaching bearbeiten" : "Coaching anlegen"}</DialogTitle>
          <DialogDescription>Termin, Teilnehmer, Preis und Zahlungsstand.</DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Trainer</FieldLabel>
              <Select
                items={coaches.map((coach) => ({ value: coach.id, label: coach.name }))}
                onValueChange={(value) => setCoachUserId(String(value))}
                value={coachUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trainer wählen" />
                </SelectTrigger>
                <SelectPopup>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Datum</FieldLabel>
              <Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
                <PopoverTrigger
                  render={<Button className="w-full justify-start font-normal" variant="outline" />}
                >
                  <CalendarIcon />
                  {date
                    ? format(dateFromYmd(date)!, "dd. MMMM yyyy", { locale: de })
                    : "Datum wählen"}
                </PopoverTrigger>
                <PopoverPopup align="start">
                  <Calendar
                    captionLayout="dropdown"
                    locale={de}
                    mode="single"
                    onSelect={(selected) => {
                      if (selected) {
                        setDate(ymdFromDate(selected));
                        setCalendarOpen(false);
                      }
                    }}
                    selected={dateFromYmd(date)}
                  />
                </PopoverPopup>
              </Popover>
            </Field>
            <Field>
              <FieldLabel>Beginn</FieldLabel>
              <Input
                onChange={(event) => setStartTime(event.target.value)}
                type="time"
                value={startTime}
              />
            </Field>
            <Field>
              <FieldLabel>Ende</FieldLabel>
              <Input
                onChange={(event) => setEndTime(event.target.value)}
                type="time"
                value={endTime}
              />
            </Field>
            <Field>
              <FieldLabel>Ort</FieldLabel>
              <Input onChange={(event) => setLocation(event.target.value)} value={location} />
            </Field>
            <Field>
              <FieldLabel>Preis (€)</FieldLabel>
              <Input
                min="0"
                onChange={(event) => setPrice(event.target.value)}
                step="0.01"
                type="number"
                value={price}
              />
            </Field>
            <Field>
              <FieldLabel>Zahlungsstatus</FieldLabel>
              <Select
                onValueChange={(value) => setPaymentStatus(value as typeof paymentStatus)}
                value={paymentStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="paid">Bezahlt</SelectItem>
                  <SelectItem value="waived">Erlassen</SelectItem>
                </SelectPopup>
              </Select>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Teilnehmer</FieldLabel>
              {participant ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <UserAvatar
                    className="size-8"
                    name={participant.name}
                    seed={participant.memberId ?? participant.name}
                  />
                  <span className="flex-1 font-medium">{participant.name}</span>
                  <Button
                    aria-label="Teilnehmer entfernen"
                    onClick={() => setParticipant(null)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <XIcon />
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="member">
                  <TabsList>
                    <TabsTab value="member">Mitglied</TabsTab>
                    <TabsTab value="guest">Gast</TabsTab>
                  </TabsList>
                  <TabsPanel className="pt-3" value="member">
                    <Combobox<MemberRow>
                      inputValue={searchInput}
                      items={memberQuery.data?.data ?? []}
                      itemToStringLabel={(item) => `${item.firstName} ${item.lastName}`}
                      onInputValueChange={setSearchInput}
                      onValueChange={(item) =>
                        item &&
                        setParticipant({
                          memberId: item.id,
                          name: `${item.firstName} ${item.lastName}`,
                        })
                      }
                    >
                      <ComboboxInput
                        placeholder="Mitglied suchen…"
                        startAddon={
                          memberQuery.isFetching ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SearchIcon />
                          )
                        }
                      />
                      <ComboboxPopup>
                        <ComboboxEmpty>Keine Mitglieder gefunden</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.firstName} {item.lastName}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxPopup>
                    </Combobox>
                  </TabsPanel>
                  <TabsPanel className="flex gap-2 pt-3" value="guest">
                    <Input
                      onChange={(event) => setGuestName(event.target.value)}
                      placeholder="Name des Gastes"
                      value={guestName}
                    />
                    <Button
                      disabled={!guestName.trim()}
                      onClick={() => setParticipant({ name: guestName.trim() })}
                      type="button"
                    >
                      Hinzufügen
                    </Button>
                  </TabsPanel>
                </Tabs>
              )}
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Notizen</FieldLabel>
              <Textarea onChange={(event) => setNotes(event.target.value)} value={notes} />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm sm:col-span-2">
              <Checkbox
                checked={allowConflict}
                onCheckedChange={(checked) => setAllowConflict(checked === true)}
              />
              <span>
                <span className="block font-medium">Terminkonflikt erlauben</span>
                <span className="text-muted-foreground">
                  Nur aktivieren, wenn der Trainer bewusst parallel eingeplant wird.
                </span>
              </span>
            </label>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button disabled={!valid} loading={create.isPending || update.isPending} type="submit">
              {appointment ? "Speichern" : "Anlegen"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
