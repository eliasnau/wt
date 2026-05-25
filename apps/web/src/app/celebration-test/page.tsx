"use client";

// TEMPORARY preview harness for the celebration variants — touches no data.
// Visit http://localhost:3001/celebration-test in dev, then delete this folder.
import { CelebrateButton } from "@/components/ui/celebration";

export default function CelebrationTestPage() {
	return (
		<div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-10">
			<div className="space-y-1 text-center">
				<h1 className="font-heading text-2xl">Celebration-Vorschau</h1>
				<p className="text-muted-foreground text-sm">
					Nur zum Ansehen der Animation. Es werden keine Daten verändert.
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<CelebrateButton
					tier="major"
					origin="screen"
					celebrateOnClick
					size="lg"
				>
					Großes Event (major)
				</CelebrateButton>
				<CelebrateButton
					tier="minor"
					origin="button"
					celebrateOnClick
					size="lg"
					variant="outline"
				>
					Normales Event (minor)
				</CelebrateButton>
			</div>
		</div>
	);
}
