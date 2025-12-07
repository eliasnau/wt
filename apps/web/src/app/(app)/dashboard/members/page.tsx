"use client";

import { useState } from "react";
import {
	Header,
	HeaderActions,
	HeaderContent,
	HeaderDescription,
	HeaderTitle,
} from "@/app/(app)/dashboard/_components/page-header";
import { Button } from "@/components/ui/button";
import { Menu, MenuPopup, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Plus, QrCodeIcon } from "lucide-react";
import { MembersTable } from "./_components/members-table";
import { GenerateQRSheet } from "./_components/generate-qr-sheet";

export default function MembersPage() {
	const [qrSheetOpen, setQrSheetOpen] = useState(false);

	const handleGenerateQR = () => {
		setQrSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-6">
			<Header>
				<HeaderContent>
					<HeaderTitle>Members</HeaderTitle>
					<HeaderDescription>
						Manage your organization members and their roles
					</HeaderDescription>
				</HeaderContent>
				<HeaderActions>
					<Menu>
						<MenuTrigger
							render={
								<Button className="w-full justify-between gap-2 sm:w-auto sm:justify-center">
									<span className="flex items-center gap-2">
										<Plus className="size-4" />
										Create Member
									</span>
								</Button>
							}
						/>
						<MenuPopup align="end">
							<MenuItem onClick={() => console.log("Add manually")}>
								<Plus />
								Add Manually
							</MenuItem>
							<MenuItem onClick={handleGenerateQR}>
								<QrCodeIcon />
								Generate QR Code
							</MenuItem>
						</MenuPopup>
					</Menu>
				</HeaderActions>
			</Header>

			<MembersTable />

			<GenerateQRSheet open={qrSheetOpen} onOpenChange={setQrSheetOpen} />
		</div>
	);
}
