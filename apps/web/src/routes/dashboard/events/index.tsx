import { Button } from "@matdesk/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlusIcon } from "lucide-react";
import { useState } from "react";

import { EventDialog, type EventRow } from "@/components/dashboard/events/event-dialog";
import { EventsCard } from "@/components/dashboard/events/events-card";
import { eventsListQueryOptions } from "@/queries/events";

export const Route = createFileRoute("/dashboard/events/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(eventsListQueryOptions());
  },
  pendingComponent: EventsPageSkeleton,
  component: RouteComponent,
});

function EventsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Veranstaltungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plane Termine und verwalte die Teilnehmer.
        </p>
      </div>
      <EventsCard loading />
    </div>
  );
}

function RouteComponent() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Veranstaltungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plane Termine und verwalte die Teilnehmer.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <CalendarPlusIcon />
          Veranstaltung hinzufügen
        </Button>
      </div>
      <EventsCard
        onEdit={(event) => {
          setEditing(event);
          setEditorOpen(true);
        }}
      />
      <EventDialog event={editing} onOpenChange={setEditorOpen} open={editorOpen} />
    </div>
  );
}
