import { cn } from "@/lib/utils";
import { Card } from "./card";

interface DisplayCardProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	centerContent?: boolean;
	className?: string;
	cardHeaderClassName?: string;
}

export function DisplayCard({
	title,
	description,
	icon,
	children,
	centerContent = false,
	className,
	cardHeaderClassName,
}: DisplayCardProps) {
	return (
		<Card
			title={title}
			description={description}
			icon={icon}
			className={cn("h-full overflow-hidden", className)}
			variant="extra-rounding"
			cardHeaderClassName={cardHeaderClassName}
		>
			<div
				className={cn(
					"flex h-full min-h-40 border-[#F6F6F6] border-t bg-[#FCFCFC]",
					centerContent ? "items-center justify-center" : "items-end",
				)}
			>
				{children}
			</div>
		</Card>
	);
}
