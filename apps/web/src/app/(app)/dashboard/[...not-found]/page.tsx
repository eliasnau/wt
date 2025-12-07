import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, TriangleAlert } from "lucide-react";

export default function DashboardNotFound() {
	return (
		<div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="font-heading text-4xl lg:text-5xl">Page not found</h1>
				<p className="text-muted-foreground lg:text-lg">
					This page doesn't exist
				</p>
				<div className="mt-4 flex gap-3">
					<Button
						className="group"
						render={
							<Link href="/dashboard">
								<Home className="-ms-1 opacity-60" />
								Home
							</Link>
						}
						size="lg"
					/>
					<Button
						className="group"
						render={
							<Link href="/support" target="_blank" rel="noopener noreferrer">
								<TriangleAlert className="-ms-1 opacity-60" />
								Support
							</Link>
						}
						size="lg"
						variant="outline"
					/>
				</div>
			</div>
		</div>
	);
}
