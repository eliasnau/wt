import { cn } from "@/lib/utils";
import { BlurFade } from "./blur-fade";

interface WordRevealProps {
  children?: string;
  words?: React.ReactNode[];
  duration?: number;
  delay?: number;
  spaceBetween?: string;
}

export function WordReveal({
  children,
  words,
  duration = 0.06,
  delay = 0,
  spaceBetween = "w-3",
}: WordRevealProps) {
  const wordsToReveal = children ? children.split(" ") : words || [];

  return (
    <>
      {wordsToReveal.map((word, index) => (
        <BlurFade
        className="font-heading"
          delay={delay + duration * index}
          inView
          as="span"
          key={`${word}-${index}`}
        >
          {word}
          {index < wordsToReveal.length - 1 && (
            <span className={cn("inline-block", spaceBetween)}> </span>
          )}
        </BlurFade>
      ))}
    </>
  );
}