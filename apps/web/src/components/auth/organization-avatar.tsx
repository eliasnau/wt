import { Avatar, AvatarFallback, AvatarImage } from "@matdesk/ui/components/avatar";
import { cn } from "@matdesk/ui/lib/utils";
import { DitherAvatar } from "dither-avatar/react";

export function OrganizationAvatar({
  id,
  name,
  logo,
  className,
}: {
  id: string;
  name: string;
  logo?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("rounded-md", className)}>
      {logo ? <AvatarImage alt={name} src={logo} /> : null}
      <AvatarFallback className="rounded-md">
        {/* DitherAvatar defaults to a 50% (circular) borderRadius — square it off
            so the Avatar's own rounded corners define the (slightly rounded) shape. */}
        <DitherAvatar className="size-full" seed={id} style={{ borderRadius: 0 }} />
      </AvatarFallback>
    </Avatar>
  );
}
