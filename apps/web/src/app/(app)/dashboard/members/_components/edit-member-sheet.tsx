import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetPopup,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetPanel,
	SheetFooter,
} from "@/components/ui/sheet";
import type { client } from "@/utils/orpc";
import type { InferClientOutputs } from '@orpc/client';

type MembersListResponse = InferClientOutputs<typeof client>['members']['list'];
type Member = MembersListResponse["data"][number];

interface EditMemberSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: Member | null;
}

export function EditMemberSheet({
	open,
	onOpenChange,
	member,
}: EditMemberSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetPopup inset>
				<SheetHeader>
					<SheetTitle>Edit Member</SheetTitle>
					<SheetDescription>
						Update member information and group assignments.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-4">
						<Field>
							<FieldLabel>First Name</FieldLabel>
							<Input
								defaultValue={member?.firstName}
								placeholder="Enter first name"
							/>
						</Field>
						<Field>
							<FieldLabel>Last Name</FieldLabel>
							<Input
								defaultValue={member?.lastName}
								placeholder="Enter last name"
							/>
						</Field>
						<Field>
							<FieldLabel>Email</FieldLabel>
							<Input
								type="email"
								defaultValue={member?.email}
								placeholder="email@example.com"
							/>
						</Field>
						<Field>
							<FieldLabel>Phone</FieldLabel>
							<Input
								type="tel"
								defaultValue={member?.phone}
								placeholder="+1 (555) 000-0000"
							/>
						</Field>
						<Field>
							<FieldLabel>Groups</FieldLabel>
							<Input
								defaultValue={member?.groupMembers?.map(gm => gm.group.name).join(", ") ?? ""}
								placeholder="Enter groups separated by commas"
							/>
						</Field>
					</div>
				</SheetPanel>
				<SheetFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={() => onOpenChange(false)}>Save Changes</Button>
				</SheetFooter>
			</SheetPopup>
		</Sheet>
	);
}
