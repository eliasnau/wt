import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundTracker } from "./not-found-tracker";

export const metadata: Metadata = {
	description:
		"The page you're looking for doesn't exist or may have been moved.",
	title: "Page Not Found",
};

export default function NotFound() {
	return (
		<>
			<NotFoundTracker />
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-2 text-center">
					<h1 className="font-heading text-4xl lg:text-5xl">Page not found</h1>
					<p className="text-muted-foreground lg:text-lg">
						This page doesn't exist
					</p>
					<div className="mt-4">
						<Button
							className="group"
							render={
								<Link href="/">
									<ArrowLeft className="-ms-1 group-hover:-translate-x-0.5 opacity-60 transition-transform" />
									Back to Home
								</Link>
							}
							size="lg"
						/>
					</div>
				</div>
			</div>
		</>
	);
}
