import Link from "next/link";
import { cn } from "@/lib/utils";
import { CardWrapper } from "./_components/card-wrapper";
import { Section, SectionContent } from "./_components/section";
import { Paragraph } from "./_components/typography";

interface FooterProps {
	className?: string;
}

export function Footer({ className }: FooterProps) {
	const currentYear = new Date().getFullYear();

	return (
		<Section className={cn("mt-20", className)}>
			<SectionContent>
				<CardWrapper className="p-8 md:p-12">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						<div className="col-span-2 flex flex-col gap-4 pr-8 md:col-span-1">
							<Link href="/" className="flex items-center gap-2">
								<span className="font-bold font-heading text-xl">
									Martial Arts
								</span>
							</Link>
							<Paragraph size="sm" color="light">
								The best way to manage your martial arts studio.
							</Paragraph>
						</div>
						<div>
							<h3 className="mb-4 font-semibold text-gray-900 text-sm">
								Product
							</h3>
							<ul className="space-y-3">
								<li>
									<Link
										href="#features"
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Features
									</Link>
								</li>
								<li>
									<Link
										href="#pricing"
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Pricing
									</Link>
								</li>
								<li>
									<Link
										href={"/demo" as any}
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Demo
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="mb-4 font-semibold text-gray-900 text-sm">
								Company
							</h3>
							<ul className="space-y-3">
								<li>
									<Link
										href={"/about" as any}
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										About
									</Link>
								</li>
								<li>
									<Link
										href={"/blog" as any}
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Blog
									</Link>
								</li>
								<li>
									<Link
										href={"/contact" as any}
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Contact
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="mb-4 font-semibold text-gray-900 text-sm">
								Legal
							</h3>
							<ul className="space-y-3">
								<li>
									<Link
										href={"/privacy" as any}
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Privacy
									</Link>
								</li>
								<li>
									<Link
										href={"/terms" as any}
										className="text-gray-500 text-sm transition-colors hover:text-gray-900"
									>
										Terms
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-[#F7F7F7] border-t pt-8 md:flex-row">
						<Paragraph size="xs" color="light">
							&copy; {currentYear} Martial Arts Manager. All rights reserved.
						</Paragraph>
						<div className="flex space-x-6">
							{/* Add social icons here if needed */}
						</div>
					</div>
				</CardWrapper>
			</SectionContent>
		</Section>
	);
}
