"use client";

import { Button } from "@matdesk/ui/components/button";
import { Calendar } from "@matdesk/ui/components/calendar";
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
import { Textarea } from "@matdesk/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { parseError } from "evlog";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc, queryClient } from "@/utils/orpc";

export type EventRow = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  priceCents: number | null;
  capacity: number | null;
};

function dateFromYmd(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function ymdFromDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventRow | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const isEdit = Boolean(event);

  useEffect(() => {
    if (!open) return;
    setName(event?.name ?? "");
    setDescription(event?.description ?? "");
    setDate(event?.date ?? "");
    setStartTime(event?.startTime?.slice(0, 5) ?? "");
    setEndTime(event?.endTime?.slice(0, 5) ?? "");
    setLocation(event?.location ?? "");
    setPrice(event?.priceCents == null ? "" : String(event.priceCents / 100));
    setCapacity(event?.capacity == null ? "" : String(event.capacity));
  }, [event, open]);

  function done(message: string) {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: orpc.events.key() });
    onOpenChange(false);
  }

  const createMutation = useMutation(
    orpc.events.create.mutationOptions({
      onSuccess: () => done("Veranstaltung erstellt"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );
  const updateMutation = useMutation(
    orpc.events.update.mutationOptions({
      onSuccess: () => done("Veranstaltung aktualisiert"),
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  function submit() {
    const values = {
      name,
      description: description.trim() || null,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      location: location.trim() || null,
      priceCents: price === "" ? null : Math.round(Number(price) * 100),
      capacity: capacity === "" ? null : Number(capacity),
    };
    if (event) updateMutation.mutate({ eventId: event.id, ...values });
    else createMutation.mutate(values);
  }

  const pending = createMutation.isPending || updateMutation.isPending;
  const validTimes = (!startTime && !endTime) || (Boolean(startTime) && endTime > startTime);
  const valid = name.trim() && date && validTimes;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Veranstaltung bearbeiten" : "Veranstaltung erstellen"}
          </DialogTitle>
          <DialogDescription>Erfasse Termin, Ort, Preis und verfügbare Plätze.</DialogDescription>
        </DialogHeader>
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Name</FieldLabel>
              <Input autoFocus onChange={(e) => setName(e.target.value)} value={name} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Beschreibung</FieldLabel>
              <Textarea onChange={(e) => setDescription(e.target.value)} value={description} />
            </Field>
            <Field>
              <FieldLabel>Datum</FieldLabel>
              <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
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
                    endMonth={new Date(new Date().getFullYear() + 10, 11)}
                    locale={de}
                    mode="single"
                    onSelect={(selected) => {
                      if (!selected) return;
                      setDate(ymdFromDate(selected));
                      setDatePickerOpen(false);
                    }}
                    selected={dateFromYmd(date)}
                    startMonth={new Date(new Date().getFullYear() - 5, 0)}
                  />
                </PopoverPopup>
              </Popover>
            </Field>
            <Field>
              <FieldLabel>Ort</FieldLabel>
              <Input onChange={(e) => setLocation(e.target.value)} value={location} />
            </Field>
            <Field>
              <FieldLabel>Beginn</FieldLabel>
              <Input onChange={(e) => setStartTime(e.target.value)} type="time" value={startTime} />
            </Field>
            <Field>
              <FieldLabel>Ende</FieldLabel>
              <Input onChange={(e) => setEndTime(e.target.value)} type="time" value={endTime} />
            </Field>
            <Field>
              <FieldLabel>Preis (€)</FieldLabel>
              <Input
                min="0"
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                type="number"
                value={price}
              />
            </Field>
            <Field>
              <FieldLabel>Kapazität</FieldLabel>
              <Input
                min="0"
                onChange={(e) => setCapacity(e.target.value)}
                step="1"
                type="number"
                value={capacity}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Abbrechen</DialogClose>
            <Button disabled={!valid} loading={pending} type="submit">
              {isEdit ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
