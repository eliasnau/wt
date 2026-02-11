import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/landing/_components/button";
import {
	Section,
	SectionContent,
} from "@/components/landing/_components/section";
import {
	PageHeading,
	Paragraph,
} from "@/components/landing/_components/typography";
import { Footer } from "@/components/landing/footer";
import { NotFoundTracker } from "./not-found-tracker";
import { IconHouse } from "nucleo-glass";

export const metadata: Metadata = {
	description:
		"Die gesuchte Seite existiert nicht oder wurde verschoben.",
	title: "Page Not Found",
};

export default function NotFound() {
	return (
		<>
			<NotFoundTracker />
			<div className="flex min-h-screen flex-col justify-between bg-white">
				<main className="flex flex-grow items-center justify-center">
					<Section>
						<SectionContent className="flex flex-col items-center gap-6 text-center">
							<PageHeading>Seite nicht gefunden</PageHeading>
							<Paragraph size="lg" color="light">
								The page you&apos;re looking for doesn&apos;t exist or may have
								verschoben.
							</Paragraph>
							<Button size="lg" variant="primary" asChild>
								<Link href="/" >
									<IconHouse className="z-10 size-4"/>
									<span className="relative z-10">Zur Startseite</span>
								</Link>
							</Button>
						</SectionContent>
					</Section>
				</main>
				<Footer className="mx-auto w-full max-w-6xl px-6 lg:px-8 xl:px-0" />
			</div>
		</>
	);
}
