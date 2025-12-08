import { Button } from "@/components/ui/button";
import { Menu, MenuPopup, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Plus, QrCodeIcon } from "lucide-react";

interface CreateMemberButtonProps {
	onGenerateQR: () => void;
}

export function CreateMemberButton({ onGenerateQR }: CreateMemberButtonProps) {
	return (
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
				<MenuItem onClick={onGenerateQR}>
					<QrCodeIcon />
					Generate QR Code
				</MenuItem>
			</MenuPopup>
		</Menu>
	);
}
