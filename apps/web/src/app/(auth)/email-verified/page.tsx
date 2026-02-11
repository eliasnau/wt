"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

import { useQueryState } from "nuqs";

export default function VerifyEmailPage() {
	const [errorParam] = useQueryState("error");
	const router = useRouter();

	const hasError = Boolean(errorParam);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-lg">
				<Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-sm shadow-black/5 after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding dark:after:bg-background/72 lg:rounded-2xl lg:border">
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
									{hasError ? "Verifizierung fehlgeschlagen" : "E-Mail verifiziert"}
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
						<p className="text-sm text-muted-foreground">
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
