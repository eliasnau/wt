import { FullWidthDivider } from "@/components/ui/full-width-divider";
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <div className="py-16 md:py-24">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col justify-between border-x md:flex-row">
        <FullWidthDivider className="-top-px" />
        <div className="border-b p-4 md:border-b-0">
          <h2 className="text-center font-bold text-lg md:text-left md:text-2xl">
            Let your plans shape the future.
          </h2>
        </div>
        <div className="flex items-center justify-center gap-2 p-4 md:border-l">
          <Button variant="outline">Contact Sales</Button>
          <Button>Get Started</Button>
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </div>
  );
}
