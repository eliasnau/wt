import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Header({
	className,
	children,
	...props
}: React.ComponentProps<"header">) {
	return (
		<header
			className={cn(
				"flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
				className,
			)}
			{...props}
		>
			{children}
		</header>
	);
}

function HeaderContent({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex-1 space-y-1", className)} {...props}>
			{children}
		</div>
	);
}

function HeaderTitle({
	className,
	children,
	...props
}: React.ComponentProps<"h1">) {
	return (
		<h1
			className={cn(
				"text-2xl font-heading tracking-tight sm:text-3xl",
				className,
			)}
			{...props}
		>
			{children}
		</h1>
	);
}

function HeaderDescription({
	className,
	children,
	...props
}: React.ComponentProps<"p">) {
	return (
		<p
			className={cn("text-muted-foreground text-sm sm:text-base", className)}
			{...props}
		>
			{children}
		</p>
	);
}

function HeaderActions({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 sm:flex-row sm:items-center",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export { Header, HeaderContent, HeaderTitle, HeaderDescription, HeaderActions };
