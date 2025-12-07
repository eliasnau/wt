"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Field } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetFooter,
	SheetPopup,
	SheetTrigger,
	SheetPanel,
	SheetClose,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";

export function NewGroupSheet() {
	const [value, setValue] = React.useState("");

	return (
		<Sheet>
			<SheetTrigger render={<Button variant="default" />}>
				<Plus className="mr-2 h-4 w-4" />
				New Group
			</SheetTrigger>
			<SheetPopup inset>
				<Form
					className="h-full gap-0"
					onSubmit={(event) => {
						event.preventDefault();
						setValue("");
					}}
				>
					<SheetHeader>
						<SheetTitle>Create Group</SheetTitle>
						<SheetDescription>Create a new Group</SheetDescription>
					</SheetHeader>
					<SheetPanel className="grid gap-4">
						<Field>
							<FieldLabel>Name</FieldLabel>
							<Input
								placeholder="Kids"
								type="text"
								value={value}
								onChange={(e) => setValue(e.target.value)}
							/>
						</Field>
					</SheetPanel>
					<SheetFooter>
						<SheetClose render={<Button variant="ghost" />}>Cancel</SheetClose>
						<Button type="submit">Save</Button>
					</SheetFooter>
				</Form>
			</SheetPopup>
		</Sheet>
	);
}
