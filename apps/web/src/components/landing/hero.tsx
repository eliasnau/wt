"use client";

import Image from "next/image";
// import { Gmail } from "@/components/new-landing/icons/Gmail";
// import { Outlook } from "@/components/new-landing/icons/Outlook";
import {
    PageHeading,
    Paragraph,
} from "./_components/typography";
// import { LiquidGlassButton } from "@/components/new-landing/LiquidGlassButton";
// import { Play } from "@/components/new-landing/icons/Play";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
// import { UnicornScene } from "@/components/new-landing/UnicornScene";
import {
    Badge,
    type BadgeVariant,
} from "./_components/badge";
import { Section, SectionContent } from "./_components/section";
import { BlurFade } from "./_components/blur-fade";
import { MessageCircle, Play } from "lucide-react";
import { LiquidGlassButton } from "./_components/liquid-glass-button";
import { Button } from "./_components/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconMsgs } from "nucleo-glass";

interface HeroProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    badgeVariant?: BadgeVariant;
    children?: React.ReactNode;
    isSignedIn?: Boolean;
}

export function Hero({
    title,
    subtitle,
    isSignedIn,
    badge,
    badgeVariant = "blue",
    children,
}: HeroProps) {
    return (
        <Section className={badge ? "mt-7 md:mt-7" : "mt-10 md:mt-20"}>
            {badge ? (
                <BlurFade duration={0.4} delay={0}>
                    <div className="flex justify-center mb-7">
                        <Badge variant={badgeVariant}>{badge}</Badge>
                    </div>
                </BlurFade>
            ) : null}
            <PageHeading>{title}</PageHeading>
            <BlurFade duration={0.4} delay={0.125 * 5}>
                <Paragraph size="lg" className={"max-w-[640px] mx-auto mt-6"}>
                    {subtitle}
                </Paragraph>
            </BlurFade>
            <SectionContent noMarginTop className="mt-6 md:mt-8">
                <div className="space-y-3 mb-8">
                    <BlurFade duration={0.4} delay={0.125 * 7}>
                        <div className={"flex justify-center items-center gap-4"}>
                            {isSignedIn ? <><Button size="xl" asChild>
                                <Link
                                    href="/sign-up"
                                >
                                    <span className="relative z-10">Get started</span>
                                </Link>
                            </Button>
                            <Button variant="secondary-two" size="xl" asChild>
                                <Link
                                    href={"/sign-in" as any}
                                >
                                    {/* <IconMsgs /> */}
                                    Log in
                                </Link>
                            </Button> </>:
                                <Button variant="secondary-two" size="xl" asChild>
                                    <Link
                                        href={"/dashboard" as any}
                                    >
                                        {/* <IconMsgs /> */}
                                        Dashboard
                                    </Link>
                                </Button>
                            }
                        </div>
                    </BlurFade>
                    {/* <BlurFade duration={0.4} delay={0.125 * 8}>
                        <div className="mb-12 flex items-center gap-2 justify-center">
                            <Paragraph color="light" size="sm">
                                Works with
                            </Paragraph>
                            <Outlook />
              <Gmail />
                        </div>
                    </BlurFade> */}
                </div>
                {children}
            </SectionContent>
        </Section>
    );
}

export function HeroVideoPlayer() {

    return (
        <BlurFade delay={0.125 * 9}>
            <div className="relative w-full">
                <div className="relative border border-[#EFEFEF] rounded-3xl md:rounded-[43px] overflow-hidden block">
                    <Dialog>
                        <DialogTrigger>
                            <LiquidGlassButton className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div>
                                    <Play className="translate-x-[2px]" />
                                </div>
                            </LiquidGlassButton>
                        </DialogTrigger>
                        <DialogContent className="max-w-7xl border-0 bg-transparent p-0">
                            <DialogTitle className="sr-only">Video player</DialogTitle>
                            <div className="relative aspect-video w-full">
                                <iframe
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                                    className="size-full rounded-lg"
                                    title="Video content"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Image
                        src="/images/landing/video-thumbnail.png"
                        alt="Our Dashboard"
                        width={2000}
                        height={1000}
                        className="w-full"
                    />
                    {/* <UnicornScene className="h-[calc(100%+5px)] opacity-30" /> */}
                </div>
            </div>
        </BlurFade>
    );
}