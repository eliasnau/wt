import type { InferClientOutputs } from "@orpc/client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetPopup,
	SheetTitle,
} from "@/components/ui/sheet";
import type { client } from "@/utils/orpc";

type MembersListResponse = InferClientOutputs<typeof client>["members"]["list"];
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
					<SheetTitle>Mitglied bearbeiten</SheetTitle>
					<SheetDescription>
						Update member information and group assignments.
					</SheetDescription>
				</SheetHeader>
				<SheetPanel>
					<div className="space-y-4">
						<Field>
							<FieldLabel>Vorname</FieldLabel>
							<Input
								defaultValue={member?.firstName}
								placeholder="Vorname eingeben"
							/>
						</Field>
						<Field>
							<FieldLabel>Nachname</FieldLabel>
							<Input
								defaultValue={member?.lastName}
								placeholder="Nachname eingeben"
							/>
						</Field>
						<Field>
							<FieldLabel>E-Mail</FieldLabel>
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
							<FieldLabel>Name des Erziehungsberechtigten</FieldLabel>
							<Input
								defaultValue={member?.guardianName || ""}
								placeholder="Name des Erziehungsberechtigten"
							/>
						</Field>
						<Field>
							<FieldLabel>E-Mail des Erziehungsberechtigten</FieldLabel>
							<Input
								type="email"
								defaultValue={member?.guardianEmail || ""}
								placeholder="guardian@example.com"
							/>
						</Field>
						<Field>
							<FieldLabel>Telefon des Erziehungsberechtigten</FieldLabel>
							<Input
								type="tel"
								defaultValue={member?.guardianPhone || ""}
								placeholder="+1 (555) 000-0000"
							/>
						</Field>

						<Field>
							<FieldLabel>Gruppen</FieldLabel>
							<Input
								defaultValue={
									member?.groupMembers?.map((gm) => gm.group.name).join(", ") ??
									""
								}
								placeholder="Enter groups separated by commas"
							/>
						</Field>
					</div>
				</SheetPanel>
				<SheetFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={() => onOpenChange(false)}>Änderungen speichern</Button>
				</SheetFooter>
			</SheetPopup>
		</Sheet>
	);
}
