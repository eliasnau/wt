"use client";

import type * as React from "react";
import {
	Drawer,
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
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Menu,
	MenuCheckboxItem,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuSub,
	MenuSubPopup,
	MenuSubTrigger,
	MenuTrigger,
} from "@/components/ui/menu";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Responsive Menu Component
 * Automatically switches between Menu (desktop) and Drawer (mobile)
 * This component is a drop-in replacement for the Menu component
 */

interface ResponsiveMenuProps {
	children: React.ReactNode;
	breakpoint?: string; // e.g., "max-md", "(max-width: 768px)"
}

function ResponsiveMenu({
	children,
	breakpoint = "max-md",
}: ResponsiveMenuProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return <Drawer>{children}</Drawer>;
	}

	return <Menu>{children}</Menu>;
}

interface ResponsiveTriggerProps {
	children: React.ReactNode;
	render?: React.ComponentProps<typeof MenuTrigger>["render"];
	breakpoint?: string;
}

function ResponsiveTrigger({
	children,
	render,
	breakpoint = "max-md",
}: ResponsiveTriggerProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerTrigger render={render}>
				{children}
			</DrawerTrigger>
		);
	}

	return (
		<MenuTrigger render={render}>
			{children}
		</MenuTrigger>
	);
}

interface ResponsivePopupProps {
	children: React.ReactNode;
	breakpoint?: string;
	showBar?: boolean; // For drawer only
	// Menu-specific props
	align?: "start" | "center" | "end";
	sideOffset?: number;
	alignOffset?: number;
	side?: "top" | "bottom" | "left" | "right";
	className?: string;
}

function ResponsivePopup({
	children,
	breakpoint = "max-md",
	showBar = true,
	align,
	sideOffset,
	alignOffset,
	side,
	className,
	...props
}: ResponsivePopupProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerPopup className={className} showBar={showBar} {...props}>
				<DrawerPanel>{children}</DrawerPanel>
			</DrawerPopup>
		);
	}

	return (
		<MenuPopup
			align={align}
			alignOffset={alignOffset}
			className={className}
			side={side}
			sideOffset={sideOffset}
			{...props}
		>
			{children}
		</MenuPopup>
	);
}

interface ResponsiveGroupProps {
	children: React.ReactNode;
	breakpoint?: string;
}

function ResponsiveGroup({
	children,
	breakpoint = "max-md",
}: ResponsiveGroupProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return <DrawerMenuGroup>{children}</DrawerMenuGroup>;
	}

	return <MenuGroup>{children}</MenuGroup>;
}

interface ResponsiveGroupLabelProps {
	children: React.ReactNode;
	breakpoint?: string;
	inset?: boolean;
	className?: string;
}

function ResponsiveGroupLabel({
	children,
	breakpoint = "max-md",
	inset,
	className,
	...props
}: ResponsiveGroupLabelProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerMenuGroupLabel className={className} {...props}>
				{children}
			</DrawerMenuGroupLabel>
		);
	}

	return (
		<MenuGroupLabel className={className} inset={inset} {...props}>
			{children}
		</MenuGroupLabel>
	);
}

interface ResponsiveItemProps {
	children: React.ReactNode;
	breakpoint?: string;
	variant?: "default" | "destructive";
	inset?: boolean;
	className?: string;
	onClick?: () => void;
	closeOnClick?: boolean; // Auto-close drawer/menu on click
	disabled?: boolean;
}

function ResponsiveItem({
	children,
	breakpoint = "max-md",
	variant = "default",
	inset,
	className,
	onClick,
	closeOnClick = true,
	disabled,
	...props
}: ResponsiveItemProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		if (closeOnClick) {
			return (
				<DrawerClose
					render={
						<DrawerMenuItem
							className={className}
							disabled={disabled}
							variant={variant}
							onClick={onClick}
						/>
					}
				>
					{children}
				</DrawerClose>
			);
		}
		return (
			<DrawerMenuItem
				className={className}
				disabled={disabled}
				onClick={onClick}
				variant={variant}
			>
				{children}
			</DrawerMenuItem>
		);
	}

	return (
		<MenuItem
			className={className}
			disabled={disabled}
			inset={inset}
			onClick={onClick}
			variant={variant}
			{...props}
		>
			{children}
		</MenuItem>
	);
}

interface ResponsiveCheckboxItemProps {
	children: React.ReactNode;
	breakpoint?: string;
	variant?: "default" | "switch";
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
}

function ResponsiveCheckboxItem({
	children,
	breakpoint = "max-md",
	variant = "default",
	checked,
	defaultChecked,
	onCheckedChange,
	disabled,
	className,
	...props
}: ResponsiveCheckboxItemProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerMenuCheckboxItem
				checked={checked}
				className={className}
				defaultChecked={defaultChecked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
				variant={variant}
				{...props}
			>
				{children}
			</DrawerMenuCheckboxItem>
		);
	}

	return (
		<MenuCheckboxItem
			checked={checked}
			className={className}
			disabled={disabled}
			variant={variant}
			{...props}
		>
			{children}
		</MenuCheckboxItem>
	);
}

interface ResponsiveRadioGroupProps {
	children: React.ReactNode;
	breakpoint?: string;
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}

function ResponsiveRadioGroup({
	children,
	breakpoint = "max-md",
	value,
	defaultValue,
	onValueChange,
	...props
}: ResponsiveRadioGroupProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerMenuRadioGroup
				defaultValue={defaultValue}
				onValueChange={onValueChange}
				value={value}
				{...props}
			>
				{children}
			</DrawerMenuRadioGroup>
		);
	}

	return (
		<MenuRadioGroup defaultValue={defaultValue} value={value} {...props}>
			{children}
		</MenuRadioGroup>
	);
}

interface ResponsiveRadioItemProps {
	children: React.ReactNode;
	breakpoint?: string;
	value: string;
}

function ResponsiveRadioItem({
	children,
	breakpoint = "max-md",
	value,
	...props
}: ResponsiveRadioItemProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerMenuRadioItem value={value} {...props}>
				{children}
			</DrawerMenuRadioItem>
		);
	}

	return (
		<MenuRadioItem value={value} {...props}>
			{children}
		</MenuRadioItem>
	);
}

interface ResponsiveSeparatorProps {
	breakpoint?: string;
	className?: string;
}

function ResponsiveSeparator({
	breakpoint = "max-md",
	className,
	...props
}: ResponsiveSeparatorProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return <DrawerMenuSeparator className={className} {...props} />;
	}

	return <MenuSeparator className={className} {...props} />;
}

interface ResponsiveSubProps {
	children: React.ReactNode;
	breakpoint?: string;
}

function ResponsiveSub({
	children,
	breakpoint = "max-md",
	...props
}: ResponsiveSubProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		// On mobile, nested drawers are used for submenus
		return <Drawer {...props}>{children}</Drawer>;
	}

	return <MenuSub {...props}>{children}</MenuSub>;
}

interface ResponsiveSubTriggerProps {
	children: React.ReactNode;
	breakpoint?: string;
	inset?: boolean;
	className?: string;
}

function ResponsiveSubTrigger({
	children,
	breakpoint = "max-md",
	inset,
	className,
	...props
}: ResponsiveSubTriggerProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerMenuTrigger className={className} {...props}>
				{children}
			</DrawerMenuTrigger>
		);
	}

	return (
		<MenuSubTrigger className={className} inset={inset} {...props}>
			{children}
		</MenuSubTrigger>
	);
}

interface ResponsiveSubPopupProps {
	children: React.ReactNode;
	breakpoint?: string;
	showBar?: boolean; // For drawer only
	align?: "start" | "center" | "end";
	sideOffset?: number;
	alignOffset?: number;
	className?: string;
}

function ResponsiveSubPopup({
	children,
	breakpoint = "max-md",
	showBar = true,
	align,
	sideOffset,
	alignOffset,
	className,
	...props
}: ResponsiveSubPopupProps) {
	const isMobile = useMediaQuery(breakpoint);

	if (isMobile) {
		return (
			<DrawerPopup className={className} showBar={showBar} {...props}>
				<DrawerPanel>{children}</DrawerPanel>
			</DrawerPopup>
		);
	}

	return (
		<MenuSubPopup
			align={align}
			alignOffset={alignOffset}
			className={className}
			sideOffset={sideOffset}
			{...props}
		>
			{children}
		</MenuSubPopup>
	);
}

// Export with original menu names for drop-in replacement
// Also export with Responsive prefix for clarity
export {
	ResponsiveCheckboxItem as MenuCheckboxItem,
	ResponsiveCheckboxItem,
	ResponsiveGroup as MenuGroup,
	ResponsiveGroup,
	ResponsiveGroupLabel as MenuGroupLabel,
	ResponsiveGroupLabel,
	ResponsiveItem as MenuItem,
	ResponsiveItem,
	ResponsiveMenu as Menu,
	ResponsiveMenu,
	ResponsivePopup as MenuPopup,
	ResponsivePopup,
	ResponsiveRadioGroup as MenuRadioGroup,
	ResponsiveRadioGroup,
	ResponsiveRadioItem as MenuRadioItem,
	ResponsiveRadioItem,
	ResponsiveSeparator as MenuSeparator,
	ResponsiveSeparator,
	ResponsiveSub as MenuSub,
	ResponsiveSub,
	ResponsiveSubPopup as MenuSubPopup,
	ResponsiveSubPopup,
	ResponsiveSubTrigger as MenuSubTrigger,
	ResponsiveSubTrigger,
	ResponsiveTrigger as MenuTrigger,
	ResponsiveTrigger,
};
