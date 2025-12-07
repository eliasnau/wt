import * as React from "react";
import {
	Dialog as DialogPrimitive,
	DialogContent as DialogContentPrimitive,
	DialogTrigger as DialogTriggerPrimitive,
	DialogTitle as DialogTitlePrimitive,
	DialogDescription as DialogDescriptionPrimitive,
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
			<div className="flex justify-between items-start">{children}</div>
		</div>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogTitlePrimitive>) {
	return (
		<DialogTitlePrimitive
			className={cn("text-lg font-medium", className)}
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
			className={cn("text-sm mt-1", className)}
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
				"px-6 py-3 border-t bg-muted/50 dark:bg-muted/30 rounded-b-lg flex justify-between items-center",
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
