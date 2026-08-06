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
import { CardFrame } from "@matdesk/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
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
import { useNavigate } from "@tanstack/react-router";
import { parseError } from "evlog";
import { CalendarDaysIcon, EditIcon, MapPinIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { EventRow } from "./event-dialog";
import { orpc, queryClient } from "@/utils/orpc";

function formatPrice(cents: number | null) {
  return cents == null
    ? "—"
    : (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function EventsCard({ onEdit }: { onEdit: (event: EventRow) => void }) {
  const eventsQuery = useQuery(orpc.events.list.queryOptions({}));
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const deleteMutation = useMutation(
    orpc.events.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Veranstaltung gelöscht");
        queryClient.invalidateQueries({ queryKey: orpc.events.key() });
        setDeleting(null);
      },
      onError: (error) => toast.error(parseError(error).message),
    }),
  );

  if (eventsQuery.isError) {
    return (
      <CardFrame className="flex min-h-60 flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-muted-foreground">{parseError(eventsQuery.error).message}</p>
        <Button onClick={() => eventsQuery.refetch()} variant="outline">
          Erneut versuchen
        </Button>
      </CardFrame>
    );
  }

  const events = eventsQuery.data ?? [];
  return (
    <>
      <CardFrame className="w-full min-w-0 overflow-hidden">
        <Table className="min-w-[760px]" variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Veranstaltung</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Ort</TableHead>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>Preis</TableHead>
              <TableHead className="w-px text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsQuery.isPending ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="p-0" colSpan={6}>
                  <Empty className="py-14">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarDaysIcon />
                      </EmptyMedia>
                      <EmptyTitle>Noch keine Veranstaltungen</EmptyTitle>
                      <EmptyDescription>
                        Erstelle die erste Veranstaltung, um Teilnehmer zu verwalten.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow
                  className="cursor-pointer"
                  key={event.id}
                  onClick={() =>
                    navigate({ to: "/dashboard/events/$eventId", params: { eventId: event.id } })
                  }
                >
                  <TableCell>
                    <div className="font-medium">{event.name}</div>
                    {event.description ? (
                      <div className="max-w-xs truncate text-xs text-muted-foreground">
                        {event.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {new Date(`${event.date}T12:00:00`).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {event.startTime ? (
                      <div className="text-xs text-muted-foreground">
                        {event.startTime.slice(0, 5)}–{event.endTime?.slice(0, 5)} Uhr
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.location ? (
                      <span className="flex items-center gap-1.5">
                        <MapPinIcon className="size-3.5" />
                        {event.location}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.capacity != null && event.participantCount >= event.capacity
                          ? "warning"
                          : "secondary"
                      }
                    >
                      <UsersIcon />
                      {event.participantCount}
                      {event.capacity == null ? "" : ` / ${event.capacity}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPrice(event.priceCents)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label="Bearbeiten"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(event);
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        aria-label="Löschen"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleting(event);
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardFrame>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        open={Boolean(deleting)}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Veranstaltung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{deleting?.name}“ und alle Teilnehmer werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Abbrechen</AlertDialogClose>
            <Button
              loading={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate({ eventId: deleting.id })}
              variant="destructive"
            >
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
