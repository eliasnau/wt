"use client";

import { Plus, QrCodeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";

export function CreateMemberButton() {
	const router = useRouter();

	const handleAddManually = () => {
		router.push("/dashboard/members/new");
	};

	const handleGenerateQR = () => {
		console.log("Generate QR Code");
	};

	return (
		<Menu>
			<MenuTrigger
				render={
					<Button className="w-full justify-between gap-2 sm:w-auto sm:justify-center">
						<span className="flex items-center gap-2">
							<Plus className="size-4" />
							Mitglied erstellen
						</span>
					</Button>
				}
			/>
			<MenuPopup align="end">
				<MenuItem onClick={handleAddManually}>
					<Plus />
					Add Manually
				</MenuItem>
				<MenuItem onClick={handleGenerateQR}>
					<QrCodeIcon />
					Generate QR Code
				</MenuItem>
			</MenuPopup>
		</Menu>
	);
}
