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
import type { Member } from "./types";

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
							<FieldLabel>Name</FieldLabel>
							<Input
								defaultValue={member?.name}
								placeholder="Enter member name"
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
								defaultValue={member?.groups.join(", ")}
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
