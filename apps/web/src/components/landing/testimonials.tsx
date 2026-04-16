import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { QuoteIcon } from "lucide-react";

type Testimonial = {
	quote: string;
	name: string;
	role: string;
	company: string;
	image: string;
};

const testimonials: Testimonial[] = [
	{
		quote:
			"Vor matdesk hab ich alles in Excel verwaltet — Mitglieder, Kurse, Rechnungen. Jetzt läuft das in einem Tool und ich spar mir jede Woche Stunden.",
		image: "/testimonials/marco.jpg",
		name: "Marco Hoffmann",
		role: "Inhaber",
		company: "Kampfsportakademie Rhein-Main",
	},
	{
		quote:
			"Wir sind in einem Jahr von 40 auf 120 Mitglieder gewachsen. Ohne matdesk hätten wir das organisatorisch nicht geschafft.",
		image: "/testimonials/sarah.jpg",
		name: "Sarah Weber",
		role: "Schulleitung",
		company: "Taekwondo Zentrum Berlin",
	},
	{
		quote:
			"Endlich weiß ich genau, wer gezahlt hat und wer nicht. Die Finanzen im Blick zu haben, war vorher ein Albtraum.",
		image: "/testimonials/daniel.jpg",
		name: "Daniel Krause",
		role: "Gründer",
		company: "MMA Factory Hamburg",
	},
];

export function TestimonialsSection() {
	return (
		<div className="space-y-12">
			<div className="mx-auto max-w-md space-y-2 text-center">
				<h2 className="font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
					Was unsere Nutzer sagen
				</h2>
				<p className="text-muted-foreground text-sm md:text-base">
					Schulen jeder Größe vertrauen auf matdesk für ihren Alltag.
				</p>
			</div>
			<div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-3 md:gap-6">
			{testimonials.map((testimonial, index) => (
				<TestimonialCard
					index={index}
					key={testimonial.name}
					testimonial={testimonial}
				/>
			))}
		</div>
		</div>
	);
}

function TestimonialCard({
	testimonial,
	index,
	className,
	...props
}: React.ComponentProps<"figure"> & {
	testimonial: Testimonial;
	index: number;
}) {
	const { quote, name, role, company, image } = testimonial;

	return (
		<figure
			className={cn(
				"relative flex flex-col justify-between gap-6 px-8 pt-8 pb-6 shadow-xs md:translate-y-[calc(3rem*var(--t-card-index))]",
				"dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]",
				className,
			)}
			style={
				{
					"--t-card-index": index,
				} as React.CSSProperties
			}
			{...props}
		>
			<div className="absolute -inset-y-4 -left-px w-px bg-border" />
			<div className="absolute -inset-y-4 -right-px w-px bg-border" />
			<div className="absolute -inset-x-4 -top-px h-px bg-border" />
			<div className="absolute -right-4 -bottom-px -left-4 h-px bg-border" />
			<DecorIcon className="size-3.5" position="top-left" />

			<blockquote className="flex gap-4">
				<QuoteIcon aria-hidden="true" className="size-6 shrink-0 stroke-1" />

				<p className="flex-1 font-normal text-base text-muted-foreground leading-relaxed">
					{quote}
				</p>
			</blockquote>

			<figcaption className="flex items-center gap-3">
				<Avatar className="size-10 rounded-full ring-2 ring-border ring-offset-2 ring-offset-background transition-shadow group-hover:ring-foreground/20">
					<AvatarImage alt={`${name}'s profile picture`} src={image} />
					<AvatarFallback>{name.charAt(0)}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col">
					<cite className="font-medium text-foreground text-sm not-italic">
						{name}
					</cite>
					<p className="text-muted-foreground text-xs">
						{role}, <span className="text-foreground/80">{company}</span>
					</p>
				</div>
			</figcaption>
		</figure>
	);
}
