"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";

export default function VerifyEmailPage() {
	const [errorParam] = useQueryState("error");
	const router = useRouter();

	const hasError = Boolean(errorParam);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-lg">
				<Frame className="relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
					<FramePanel>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									{hasError ? (
										<XCircle className="text-destructive" />
									) : (
										<CheckCircle2 className="text-green-500" />
									)}
								</EmptyMedia>
								<EmptyTitle>
									{hasError
										? "Verifizierung fehlgeschlagen"
										: "E-Mail verifiziert"}
								</EmptyTitle>
								<EmptyDescription>
									{hasError
										? "E-Mail-Verifizierung fehlgeschlagen."
										: "Deine E-Mail wurde erfolgreich verifiziert! Du kannst jetzt auf alle Funktionen deines Kontos zugreifen."}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => router.push("/account" as Route)}>
									Account
								</Button>
							</EmptyContent>
						</Empty>
					</FramePanel>
					<FrameFooter className="flex-row items-center justify-center">
						<p className="text-muted-foreground text-sm">
							Need help?{" "}
							<Link
								href={"/support" as Route}
								className="text-foreground hover:underline"
							>
								Support kontaktieren
							</Link>
						</p>
					</FrameFooter>
				</Frame>
			</div>
		</div>
	);
}
