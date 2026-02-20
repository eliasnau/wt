import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { HomeIcon, CompassIcon } from "lucide-react";
import { NotFoundTracker } from "./not-found-tracker";

export const metadata: Metadata = {
  description: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
  title: "Seite nicht gefunden",
};

export default function NotFound() {
  return (
    <>
      <NotFoundTracker />
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-9xl">
              404
            </EmptyTitle>
            <EmptyDescription className="-mt-8 text-nowrap text-foreground/80">
              Die gesuchte Seite wurde möglicherweise <br />
              verschoben oder existiert nicht.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button render={<a href="/" />}>
                <HomeIcon data-icon="inline-start" />
                Startseite
              </Button>
              <Button variant="outline" render={<a href="/features" />}>
                <CompassIcon data-icon="inline-start" />
                Entdecken
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </>
  );
}
