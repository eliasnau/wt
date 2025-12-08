import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { UsersIcon } from "lucide-react";
import { CreateMemberButton } from "./create-member-button";

interface EmptyMembersProps {
	hasMembers: boolean;
	onGenerateQR: () => void;
}

export function EmptyMembers({ hasMembers, onGenerateQR }: EmptyMembersProps) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<UsersIcon />
				</EmptyMedia>
				<EmptyTitle>
					{!hasMembers ? "No members yet" : "No members found"}
				</EmptyTitle>
				<EmptyDescription>
					{!hasMembers
						? "Get started by creating your first member."
						: "Try adjusting your search or filters to find what you're looking for."}
				</EmptyDescription>
			</EmptyHeader>
			{!hasMembers && (
				<EmptyContent>
					<CreateMemberButton onGenerateQR={onGenerateQR} />
				</EmptyContent>
			)}
		</Empty>
	);
}
