"use client";

import { Dialog as DrawerPrimitive } from "@base-ui-components/react/dialog";
import type * as React from "react";
import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;

const DrawerPortal = DrawerPrimitive.Portal;

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerBackdrop({
	className,
	...props
}: DrawerPrimitive.Backdrop.Props) {
	return (
		<DrawerPrimitive.Backdrop
			className={cn(
				"fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
				className,
			)}
			data-slot="drawer-backdrop"
			{...props}
		/>
	);
}

function DrawerViewport({
	className,
	...props
}: DrawerPrimitive.Viewport.Props) {
	return (
		<DrawerPrimitive.Viewport
			className={cn(
				"fixed inset-0 z-50 grid grid-rows-[1fr_auto] pt-12",
				className,
			)}
			data-slot="drawer-viewport"
			{...props}
		/>
	);
}

function DrawerPopup({
	className,
	children,
	showBar = false,
	...props
}: DrawerPrimitive.Popup.Props & {
	showBar?: boolean;
}) {
	return (
		<DrawerPortal>
			<DrawerBackdrop />
			<DrawerViewport>
				<DrawerPrimitive.Popup
					className={cn(
						"relative row-start-2 flex max-h-[85vh] min-h-0 w-full min-w-0 flex-col rounded-t-2xl border-t bg-popover bg-clip-padding text-popover-foreground shadow-lg transition-[opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:rounded-t-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:translate-y-8 data-starting-style:translate-y-8 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
						className,
					)}
					data-slot="drawer-popup"
					{...props}
				>
					{showBar && (
						<div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
					)}
					{children}
				</DrawerPrimitive.Popup>
			</DrawerViewport>
		</DrawerPortal>
	);
}

function DrawerPanel({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("overflow-y-auto px-4 pt-4 pb-6", className)}
			data-slot="drawer-panel"
			{...props}
		/>
	);
}

// Menu-specific drawer components

function DrawerMenu({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-col", className)}
			data-slot="drawer-menu"
			role="menu"
			{...props}
		/>
	);
}

function DrawerMenuGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-col", className)}
			data-slot="drawer-menu-group"
			{...props}
		/>
	);
}

function DrawerMenuGroupLabel({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"px-4 py-2 font-medium text-muted-foreground text-xs",
				className,
			)}
			data-slot="drawer-menu-group-label"
			{...props}
		/>
	);
}

function DrawerMenuItem({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"button"> & {
	variant?: "default" | "destructive";
}) {
	return (
		<button
			className={cn(
				"flex min-h-12 w-full cursor-default select-none items-center gap-3 rounded-lg px-4 py-3 text-left text-base text-foreground outline-none transition-colors active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-64 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-5 [&>svg]:pointer-events-none [&>svg]:shrink-0",
				variant === "destructive" && "text-destructive-foreground",
				className,
			)}
			data-slot="drawer-menu-item"
			data-variant={variant}
			role="menuitem"
			type="button"
			{...props}
		/>
	);
}

function DrawerMenuCheckboxItem({
	className,
	children,
	checked,
	defaultChecked,
	onCheckedChange,
	variant = "default",
	...props
}: React.ComponentProps<"button"> & {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	variant?: "default" | "switch";
}) {
	const [isChecked, setIsChecked] = React.useState(
		checked ?? defaultChecked ?? false,
	);

	React.useEffect(() => {
		if (checked !== undefined) {
			setIsChecked(checked);
		}
	}, [checked]);

	const handleClick = () => {
		const newChecked = !isChecked;
		setIsChecked(newChecked);
		onCheckedChange?.(newChecked);
	};

	return (
		<button
			className={cn(
				"flex min-h-12 w-full cursor-default items-center gap-3 rounded-lg px-4 py-3 text-left text-base text-foreground outline-none transition-colors active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-64",
				variant === "switch" ? "justify-between" : "gap-3",
				className,
			)}
			data-slot="drawer-menu-checkbox-item"
			onClick={handleClick}
			role="menuitemcheckbox"
			type="button"
			aria-checked={isChecked}
			{...props}
		>
			{variant === "switch" ? (
				<>
					<span>{children}</span>
					<div
						className={cn(
							"inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
							isChecked ? "bg-primary" : "bg-input",
						)}
					>
						<span
							className={cn(
								"pointer-events-none block aspect-square h-5 rounded-full bg-background shadow-sm transition-transform",
								isChecked ? "translate-x-5" : "translate-x-0",
							)}
						/>
					</div>
				</>
			) : (
				<>
					<div className="flex size-5 items-center justify-center">
						{isChecked && (
							<svg
								fill="none"
								height="24"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								width="24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>Checked</title>
								<path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
							</svg>
						)}
					</div>
					<span>{children}</span>
				</>
			)}
		</button>
	);
}

function DrawerMenuRadioGroup({
	className,
	children,
	value,
	defaultValue,
	onValueChange,
	...props
}: React.ComponentProps<"div"> & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}) {
	const [selectedValue, setSelectedValue] = React.useState(
		value ?? defaultValue ?? "",
	);

	React.useEffect(() => {
		if (value !== undefined) {
			setSelectedValue(value);
		}
	}, [value]);

	const handleValueChange = (newValue: string) => {
		setSelectedValue(newValue);
		onValueChange?.(newValue);
	};

	return (
		<div
			className={cn("flex flex-col", className)}
			data-slot="drawer-menu-radio-group"
			role="radiogroup"
			{...props}
		>
			{React.Children.map(children, (child) => {
				if (React.isValidElement(child)) {
					return React.cloneElement(child, {
						...child.props,
						checked: child.props.value === selectedValue,
						onClick: () => handleValueChange(child.props.value),
					} as React.HTMLAttributes<HTMLElement>);
				}
				return child;
			})}
		</div>
	);
}

function DrawerMenuRadioItem({
	className,
	children,
	value,
	checked,
	onClick,
	...props
}: React.ComponentProps<"button"> & {
	value: string;
	checked?: boolean;
}) {
	return (
		<button
			className={cn(
				"flex min-h-12 w-full cursor-default items-center gap-3 rounded-lg px-4 py-3 text-left text-base text-foreground outline-none transition-colors active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-64",
				className,
			)}
			data-slot="drawer-menu-radio-item"
			onClick={onClick}
			role="menuitemradio"
			type="button"
			aria-checked={checked}
			{...props}
		>
			<div className="flex size-5 items-center justify-center">
				{checked && (
					<svg
						fill="none"
						height="24"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						viewBox="0 0 24 24"
						width="24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Selected</title>
						<path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
					</svg>
				)}
			</div>
			<span>{children}</span>
		</button>
	);
}

function DrawerMenuSeparator({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("my-2 h-px bg-border", className)}
			data-slot="drawer-menu-separator"
			aria-hidden="true"
			{...props}
		/>
	);
}

function DrawerMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<"button">) {
	return (
		<button
			className={cn(
				"flex min-h-12 w-full cursor-default select-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-base text-foreground outline-none transition-colors active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-64",
				className,
			)}
			data-slot="drawer-menu-trigger"
			type="button"
			{...props}
		>
			{children}
			<svg
				className="size-5 opacity-80"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>Expand</title>
				<path d="m9 18 6-6-6-6" />
			</svg>
		</button>
	);
}

export {
	Drawer,
	DrawerBackdrop,
	DrawerClose,
	DrawerMenu,
	DrawerMenuCheckboxItem,
	DrawerMenuGroup,
	DrawerMenuGroupLabel,
	DrawerMenuItem,
	DrawerMenuRadioGroup,
	DrawerMenuRadioItem,
	DrawerMenuSeparator,
	DrawerMenuTrigger,
	DrawerPanel,
	DrawerPopup,
	DrawerPortal,
	DrawerTrigger,
	DrawerViewport,
};
