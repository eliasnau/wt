import { Button } from "@matdesk/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { Building2Icon, PlusIcon } from "lucide-react";

export function NoOrganization({ onCreate }: { onCreate?: () => void }) {
  return (
    <Empty className="px-4 py-8 md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Building2Icon />
        </EmptyMedia>
        <EmptyTitle className="text-base">Keine Organisationen</EmptyTitle>
        <EmptyDescription>Erstelle deine erste Organisation, um zu starten.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onCreate} size="sm">
          <PlusIcon />
          Organisation erstellen
        </Button>
      </EmptyContent>
    </Empty>
  );
}
