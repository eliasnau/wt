"use client";

import { Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type OrganizationAvatarProps = {
	id: string;
	name: string;
	logo?: string | null;
	className?: string;
	imageClassName?: string;
	fallbackClassName?: string;
};

export function OrganizationAvatar({
	id,
	name,
	logo,
	className,
	imageClassName,
	fallbackClassName,
}: OrganizationAvatarProps) {
	return (
		<Avatar className={cn("!rounded-md size-6", className)}>
			<AvatarImage
				src={logo || `https://avatar.vercel.sh/${encodeURIComponent(id)}`}
				alt={name}
				className={cn("!rounded-md", imageClassName)}
			/>
			<AvatarFallback className={cn("!rounded-md", fallbackClassName)}>
				<Skeleton className="h-6 w-6 rounded-md" />
			</AvatarFallback>
		</Avatar>
	);
}
