import type * as React from "react";
import {
	DialogContent as DialogContentPrimitive,
	DialogDescription as DialogDescriptionPrimitive,
	Dialog as DialogPrimitive,
	DialogTitle as DialogTitlePrimitive,
	DialogTrigger as DialogTriggerPrimitive,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive>) {
	return <DialogPrimitive {...props} />;
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogTriggerPrimitive>) {
	return <DialogTriggerPrimitive {...props} />;
}

function DialogContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogContentPrimitive>) {
	return (
		<DialogContentPrimitive className={cn("p-0", className)} {...props}>
			{children}
		</DialogContentPrimitive>
	);
}

function DialogHeader({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("p-6 pb-4", className)} {...props}>
			<div className="flex items-start justify-between">{children}</div>
		</div>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogTitlePrimitive>) {
	return (
		<DialogTitlePrimitive
			className={cn("font-medium text-lg", className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogDescriptionPrimitive>) {
	return (
		<DialogDescriptionPrimitive
			className={cn("mt-1 text-sm", className)}
			{...props}
		/>
	);
}

function DialogBody({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("px-6 pb-4", className)} {...props}>
			{children}
		</div>
	);
}

function DialogFooter({
	className,
	children,
	leftContent,
	...props
}: React.ComponentProps<"div"> & {
	leftContent?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-b-lg border-t bg-muted/50 px-6 py-3 dark:bg-muted/30",
				className,
			)}
			{...props}
		>
			{leftContent && <div className="flex items-center">{leftContent}</div>}
			<div className={cn("flex gap-2", !leftContent && "ml-auto")}>
				{children}
			</div>
		</div>
	);
}

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogBody,
	DialogFooter,
};
