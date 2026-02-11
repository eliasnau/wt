import { BlurFade } from "@/components/landing/_components/blur-fade";
import { CardWrapper } from "@/components/landing/_components/card-wrapper";
import {
	Section,
	SectionContent,
} from "@/components/landing/_components/section";
import {
	PageHeading,
	Paragraph,
	Subheading,
} from "@/components/landing/_components/typography";
import { Footer } from "@/components/landing/footer";

const LAYOUT_CLASSNAME = "max-w-6xl mx-auto px-6 lg:px-8 xl:px-0";

export default function TermsPage() {
	return (
		<div>
			<main className={LAYOUT_CLASSNAME}>
				<Section className="mt-20 md:mt-32">
					<SectionContent>
						<BlurFade inView>
							<PageHeading>Nutzungsbedingungen</PageHeading>
							<div className="mt-8">
								<CardWrapper className="p-8 md:p-12">
									<div className="space-y-8">
										<Paragraph size="sm" color="light">
											Last updated: {new Date().toLocaleDateString()}
										</Paragraph>

										<div className="space-y-4">
											<Subheading>1. Akzeptanz der Bedingungen</Subheading>
											<Paragraph>
												By accessing or using the Martial Arts Manager website
												and services, you agree to be bound by these Terms of
												Service and all applicable laws and regulations. If you
												do not agree with any of these terms, you are prohibited
												from using or accessing this site.
											</Paragraph>
										</div>

										<div className="space-y-4">
											<Subheading>2. Nutzungslizenz</Subheading>
											<Paragraph>
												Permission is granted to temporarily download one copy
												of the materials (information or software) on Martial
												Arts Manager's website for personal, non-commercial
												transitory viewing only. This is the grant of a license,
												not a transfer of title, and under this license you may
												not:
											</Paragraph>
											<ul className="list-disc space-y-2 pl-5">
												<li>
													<Paragraph>die Materialien zu verändern oder zu kopieren;</Paragraph>
												</li>
												<li>
													<Paragraph>
														use the materials for any commercial purpose, or for
														any public display (commercial or non-commercial);
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														attempt to decompile or reverse engineer any
														software contained on Martial Arts Manager's
														website;
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														remove any copyright or other proprietary notations
														from the materials; or
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														transfer the materials to another person or "mirror"
														the materials on any other server.
													</Paragraph>
												</li>
											</ul>
										</div>

										<div className="space-y-4">
											<Subheading>3. Haftungsausschluss</Subheading>
											<Paragraph>
												The materials on Martial Arts Manager's website are
												provided on an 'as is' basis. Martial Arts Manager makes
												no warranties, expressed or implied, and hereby
												disclaims and negates all other warranties including,
												without limitation, implied warranties or conditions of
												merchantability, fitness for a particular purpose, or
												non-infringement of intellectual property or other
												violation of rights.
											</Paragraph>
										</div>

										<div className="space-y-4">
											<Subheading>4. Einschränkungen</Subheading>
											<Paragraph>
												In no event shall Martial Arts Manager or its suppliers
												be liable for any damages (including, without
												limitation, damages for loss of data or profit, or due
												to business interruption) arising out of the use or
												inability to use the materials on Martial Arts Manager's
												website, even if Martial Arts Manager or a Martial Arts
												Manager authorized representative has been notified
												orally or in writing of the possibility of such damage.
											</Paragraph>
										</div>

										<div className="space-y-4">
											<Subheading>5. Anwendbares Recht</Subheading>
											<Paragraph>
												These terms and conditions are governed by and construed
												in accordance with the laws and you irrevocably submit
												to the exclusive jurisdiction of the courts in that
												location.
											</Paragraph>
										</div>
									</div>
								</CardWrapper>
							</div>
						</BlurFade>
					</SectionContent>
				</Section>
			</main>
			<Footer className={LAYOUT_CLASSNAME} />
		</div>
	);
}
