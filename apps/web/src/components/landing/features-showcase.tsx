import { GridPattern } from "@/components/ui/grid-pattern";
import { IconUsers, IconChartBar, IconSparkle } from "nucleo-glass";
import Image from "next/image";
import type React from "react";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: {
    src: string;
    alt: string;
  };
};

const features: Feature[] = [
  {
    title: "Members Portal",
    description:
      "A complete hub for managing your students. Track belt progressions, attendance, contact details and more — all from one intuitive dashboard.",
    icon: <IconUsers />,
    image: {
      src: "/images/landing/members-portal.jpg",
      alt: "Members portal dashboard showing student profiles and belt levels",
    },
  },
  {
    title: "Statistics & Analytics",
    description:
      "Understand your studio at a glance. Revenue trends, member growth, class attendance, and retention metrics — visualized in real-time.",
    icon: <IconChartBar />,
    image: {
      src: "/images/landing/statistics.jpg",
      alt: "Analytics dashboard with charts and key performance metrics",
    },
  },
  {
    title: "AI Assistant",
    description:
      "Your intelligent co-pilot for studio management. Get smart suggestions, automate repetitive tasks, and surface insights you would have missed.",
    icon: <IconSparkle />,
    image: {
      src: "/images/landing/ai-assistant.jpg",
      alt: "AI assistant chat interface helping manage studio operations",
    },
  },
];

export function FeaturesShowcase() {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center">
        <h2 className="text-balance font-medium text-2xl text-foreground md:text-4xl">
          Built for martial arts studios
        </h2>
        <p className="mx-auto mt-4 max-w-[650px] text-balance text-muted-foreground text-sm md:text-base">
          Three powerful tools that cover the essentials — so you can focus on
          what matters most: your students.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-6">
        {features.map((feature, index) => (
          <FeatureRow key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const isReversed = index % 2 !== 0;

  const textContent = (
    <div className="relative overflow-hidden bg-background p-8 md:p-12">
      <div className="mask-[radial-gradient(farthest-side_at_top_left,white,transparent)] pointer-events-none absolute inset-0">
        <GridPattern
          className="absolute inset-0 size-full stroke-foreground/10"
          height={40}
          width={40}
          x={20}
        />
      </div>
      <div className="relative z-10">
        <div className="[&_svg]:size-7 [&_svg]:text-foreground/75">
          {feature.icon}
        </div>
        <h3 className="mt-6 font-medium text-foreground text-lg md:text-xl">
          {feature.title}
        </h3>
        <p className="mt-3 max-w-md font-light text-muted-foreground text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );

  const imageContent = (
    <div className="relative overflow-hidden bg-background p-4 md:p-6">
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <Image
          src={feature.image.src}
          alt={feature.image.alt}
          width={800}
          height={500}
          className="h-auto w-full object-cover"
        />
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative grid grid-cols-1 items-center gap-px bg-border lg:grid-cols-2">
        {isReversed ? (
          <>
            {imageContent}
            {textContent}
          </>
        ) : (
          <>
            {textContent}
            {imageContent}
          </>
        )}
      </div>
    </div>
  );
}
