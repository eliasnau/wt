import { DecorIcon } from "@/components/ui/decor-icon";
import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	AccordionTrigger,
} from "@/components/animate-ui/primitives/base/accordion";

type FaqItem = {
	id: string;
	title: string;
	content: string;
};

const faqs: FaqItem[] = [];

export function FaqsSection() {
	return (
		<section className="py-16 md:py-24">
			<div className="grid grid-cols-1 border-y lg:h-[38rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:overflow-hidden lg:border-x">
				<div className="px-4 py-10 md:px-8 md:py-12">
					<div className="max-w-md space-y-2">
						<h2 className="text-balance font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
							Häufige Fragen
						</h2>
						<p className="text-muted-foreground text-sm md:text-base">
							Schnelle Antworten auf häufige Fragen zu WT. Öffne eine Frage, um
							mehr zu erfahren.
						</p>
						<p className="text-muted-foreground text-sm leading-relaxed md:text-base">
							{"Noch etwas unklar? "}
							<a className="text-primary hover:underline" href="/contact">
								Kontaktiere uns
							</a>
						</p>
					</div>
				</div>

				<div className="relative border-t lg:h-full lg:border-t-0 lg:border-l">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-y-0 left-3 h-full w-px bg-border"
					/>

					<Accordion
						className="rounded-none border-x-0 lg:h-full lg:overflow-y-auto"
						defaultValue={["item-1"]}
					>
						{faqs.map((item) => (
							<AccordionItem
								className="group relative pl-5"
								key={item.id}
								value={item.id}
							>
								<DecorIcon
									className="left-[13px] size-3 group-last:hidden"
									position="bottom-left"
								/>

								<AccordionHeader>
									<AccordionTrigger className="px-4 py-4 hover:no-underline focus-visible:underline focus-visible:ring-0">
										{item.title}
									</AccordionTrigger>
								</AccordionHeader>

								<AccordionPanel className="px-4 pb-4 text-muted-foreground">
									{item.content}
								</AccordionPanel>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
