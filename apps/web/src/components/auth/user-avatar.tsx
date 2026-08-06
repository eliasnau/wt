import { Avatar, AvatarFallback, AvatarImage } from "@matdesk/ui/components/avatar";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { cn } from "@matdesk/ui/lib/utils";
import { DitherAvatar } from "dither-avatar/react";

export function UserAvatar({
  name,
  image,
  seed,
  className,
  loading,
}: {
  name?: string;
  image?: string | null;
  seed?: string;
  className?: string;
  loading?: boolean;
}) {
  if (loading || !seed) {
    return <Skeleton className={cn("size-8 rounded-full", className)} />;
  }

  return (
    <Avatar className={className}>
      {image ? <AvatarImage alt={name} src={image} /> : null}
      <AvatarFallback>
        <DitherAvatar className="size-full" seed={seed} />
      </AvatarFallback>
    </Avatar>
  );
}
