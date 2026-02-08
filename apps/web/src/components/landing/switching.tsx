"use client";

import Link from "next/link";
import {
	IconArrowsBoldOppositeDirection,
	IconFileDownload,
	IconGearKeyhole,
	IconKey,
	IconLock,
	IconStorage,
} from "nucleo-glass";
import { BlurFade } from "./_components/blur-fade";
import { Button } from "./_components/button";
import { CardWrapper } from "./_components/card-wrapper";
import { Section, SectionContent } from "./_components/section";
import { Paragraph, Subheading } from "./_components/typography";

export function SwitchingSection() {
	return (
		<Section>
			<SectionContent>
				<BlurFade inView>
					<CardWrapper className="relative overflow-hidden p-8 md:p-12">
						<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
							<div className="space-y-8">
								<div className="space-y-4">
									<Subheading className="text-left font-heading md:text-left">
										Switching from another software?
									</Subheading>
									<Paragraph
										size="lg"
										className="max-w-lg text-left md:text-left"
									>
										Don't let the fear of data loss hold you back. We provide
										a free migration services to move your member data,
										payments, and history seamlessly.
									</Paragraph>
								</div>
								<div className="flex flex-wrap gap-4">
									{/* <Button size="lg" className="z-10" asChild>
										<Link href={"/contact" as any}>Book a migration call</Link>
									</Button> */}
									<Button variant="secondary" size="lg" asChild>
										<Link href={"/demo" as any}>See how it works</Link>
									</Button>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-1">
								<div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white/50 p-4 transition-colors hover:border-gray-200 hover:bg-white">
									<div className="flex size-10 shrink-0 items-center justify-center text-blue-600">
										<IconFileDownload className="size-6" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">
											Free Data Import
										</h3>
										<p className="mt-1 text-gray-500 text-sm">
											We handle the export and import of your data for free. No
											technical skills required.
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white/50 p-4 transition-colors hover:border-gray-200 hover:bg-white">
									<div className="flex size-10 shrink-0 items-center justify-center text-blue-600">
										<IconArrowsBoldOppositeDirection className="size-6" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">
											Zero Downtime
										</h3>
										<p className="mt-1 text-gray-500 text-sm">
											Keep your studio running while we work in the background.
											Switch when you're ready.
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white/50 p-4 transition-colors hover:border-gray-200 hover:bg-white">
									<div className="flex size-10 shrink-0 items-center justify-center text-blue-600">
										<IconGearKeyhole className="size-6" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">
											Secure Transfer
										</h3>
										<p className="mt-1 text-gray-500 text-sm">
											Your data is encrypted and handled with the highest
											security standards during transfer.
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardWrapper>
				</BlurFade>
			</SectionContent>
		</Section>
	);
}
