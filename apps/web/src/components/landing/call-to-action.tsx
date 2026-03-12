import { Button } from "@/components/ui/button";
import { FullWidthDivider } from "@/components/ui/full-width-divider";

export function CallToAction() {
	return (
		<div className="py-16 md:py-24">
			<div className="relative mx-auto flex w-full max-w-3xl flex-col justify-between border-x md:flex-row">
				<FullWidthDivider className="-top-px" />
				<div className="border-b p-4 md:border-b-0">
					<h2 className="text-center font-bold text-lg md:text-left md:text-2xl">
						Lass deine Pläne die Zukunft gestalten.
					</h2>
				</div>
				<div className="flex items-center justify-center gap-2 p-4 md:border-l">
					<Button variant="outline">Vertrieb kontaktieren</Button>
					<Button>Jetzt starten</Button>
				</div>
				<FullWidthDivider className="-bottom-px" />
			</div>
		</div>
	);
}
