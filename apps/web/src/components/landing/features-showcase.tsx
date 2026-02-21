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
      src: "https://ik.imagekit.io/codity/wt/landing/hero-light.webp",
      alt: "Members portal dashboard showing student profiles and belt levels",
    },
  },
  {
    title: "Statistics & Analytics",
    description:
      "Understand your studio at a glance. Revenue trends, member growth, class attendance, and retention metrics — visualized in real-time.",
    icon: <IconChartBar />,
    image: {
      src: "https://ik.imagekit.io/codity/wt/landing/hero-light.webp",
      alt: "Analytics dashboard with charts and key performance metrics",
    },
  },
  {
    title: "AI Assistant",
    description:
      "Your intelligent co-pilot for studio management. Get smart suggestions, automate repetitive tasks, and surface insights you would have missed.",
    icon: <IconSparkle />,
    image: {
      src: "https://ik.imagekit.io/codity/wt/landing/hero-light.webp",
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

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Image */}
      <div className="overflow-hidden border-b bg-muted">
        <Image
          src={feature.image.src}
          alt={feature.image.alt}
          width={600}
          height={400}
          className="h-auto w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative overflow-hidden bg-card p-6">
        <div className="mask-[radial-gradient(farthest-side_at_top_left,white,transparent)] pointer-events-none absolute inset-0 opacity-50">
          <GridPattern
            className="absolute inset-0 size-full stroke-foreground/5"
            height={40}
            width={40}
            x={20}
          />
        </div>
        <div className="relative z-10">
          <div className="[&_svg]:size-6 [&_svg]:text-foreground/75">
            {feature.icon}
          </div>
          <h3 className="mt-4 font-medium text-foreground text-lg">
            {feature.title}
          </h3>
          <p className="mt-2 font-light text-muted-foreground text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}
