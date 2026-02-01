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

export default function PrivacyPage() {
	return (
		<div>
			<main className={LAYOUT_CLASSNAME}>
				<Section className="mt-20 md:mt-32">
					<SectionContent>
						<BlurFade inView>
							<PageHeading>Privacy Policy</PageHeading>
							<div className="mt-8">
								<CardWrapper className="p-8 md:p-12">
									<div className="space-y-8">
										<Paragraph size="sm" color="light">
											Last updated: {new Date().toLocaleDateString()}
										</Paragraph>

										<div className="space-y-4">
											<Subheading>1. Introduction</Subheading>
											<Paragraph>
												Welcome to Martial Arts Manager. We respect your privacy
												and are committed to protecting your personal data. This
												privacy policy will inform you as to how we look after
												your personal data when you visit our website and tell
												you about your privacy rights and how the law protects
												you.
											</Paragraph>
										</div>

										<div className="space-y-4">
											<Subheading>2. Data We Collect</Subheading>
											<Paragraph>
												We may collect, use, store and transfer different kinds
												of personal data about you which we have grouped
												together as follows:
											</Paragraph>
											<ul className="list-disc space-y-2 pl-5">
												<li>
													<Paragraph>
														Identity Data includes first name, last name,
														username or similar identifier.
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														Contact Data includes billing address, delivery
														address, email address and telephone numbers.
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														Technical Data includes internet protocol (IP)
														address, your login data, browser type and version,
														time zone setting and location, browser plug-in
														types and versions, operating system and platform,
														and other technology on the devices you use to
														access this website.
													</Paragraph>
												</li>
											</ul>
										</div>

										<div className="space-y-4">
											<Subheading>3. How We Use Your Data</Subheading>
											<Paragraph>
												We will only use your personal data when the law allows
												us to. Most commonly, we will use your personal data in
												the following circumstances:
											</Paragraph>
											<ul className="list-disc space-y-2 pl-5">
												<li>
													<Paragraph>
														Where we need to perform the contract we are about
														to enter into or have entered into with you.
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														Where it is necessary for our legitimate interests
														(or those of a third party) and your interests and
														fundamental rights do not override those interests.
													</Paragraph>
												</li>
												<li>
													<Paragraph>
														Where we need to comply with a legal obligation.
													</Paragraph>
												</li>
											</ul>
										</div>

										<div className="space-y-4">
											<Subheading>4. Data Security</Subheading>
											<Paragraph>
												We have put in place appropriate security measures to
												prevent your personal data from being accidentally lost,
												used or accessed in an unauthorized way, altered or
												disclosed. In addition, we limit access to your personal
												data to those employees, agents, contractors and other
												third parties who have a business need to know.
											</Paragraph>
										</div>

										<div className="space-y-4">
											<Subheading>5. Contact Us</Subheading>
											<Paragraph>
												If you have any questions about this privacy policy or
												our privacy practices, please contact us at:
												support@martialartsmanager.com
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
