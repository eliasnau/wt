import { cn } from "@/lib/utils";
import type React from "react";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  IconChartBar,
  IconCircleQuestion,
  IconKey,
  IconLaptopMobile,
  IconSitemap,
  IconUsers,
} from "nucleo-glass";

type FeatureType = {
  title: string;
  icon: React.ReactNode;
  description: string;
};

const features: FeatureType[] = [
  {
    title: "Works on any device",
    description:
      "Access your dashboard from your phone, tablet, or desktop. Optimized for every screen size.",
    icon: <IconLaptopMobile />,
  },
  {
    title: "Class Management",
    description:
      "Easily organize your students into age groups, belt levels, or custom classes for streamlined management.",
    icon: <IconUsers />,
  },
  {
    title: "Advanced Analytics",
    description:
      "Gain deep insights into your performance with comprehensive charts and reports.",
    icon: <IconChartBar />,
  },
  {
    title: "Secure & Reliable",
    description:
      "Enterprise-grade security keeps your data safe and backed up automatically.",
    icon: <IconKey />,
  },
  {
    title: "Easy Integration",
    description:
      "Connect with your favorite tools and services in just a few clicks.",
    icon: <IconSitemap />,
  },
  {
    title: "24/7 Support",
    description:
      "Our dedicated support team is available around the clock to help you succeed.",
    icon: <IconCircleQuestion />,
  },
];

export function SimpleFeatures() {
  return (
    <section className="py-16 text-center md:py-24">
      <h2 className="text-balance font-medium text-2xl text-foreground md:text-4xl">
        Everything you need to succeed
      </h2>
      <p className="mx-auto mt-4 max-w-[650px] text-balance text-muted-foreground text-sm md:text-base">
        Packed with powerful features to help you grow your business and manage
        your workflow efficiently.
      </p>

      <div className="mt-10 overflow-hidden rounded-lg border">
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard feature={feature} key={feature.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  feature: FeatureType;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-background p-6 text-left",
        className,
      )}
      {...props}
    >
      <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
        <GridPattern
          className="absolute inset-0 size-full stroke-foreground/20"
          height={40}
          width={40}
          x={20}
        />
      </div>
      <div className="[&_svg]:size-6 [&_svg]:text-foreground/75">
        {feature.icon}
      </div>
      <h3 className="mt-10 text-sm md:text-base">{feature.title}</h3>
      <p className="relative z-20 mt-2 font-light text-muted-foreground text-xs">
        {feature.description}
      </p>
    </div>
  );
}
