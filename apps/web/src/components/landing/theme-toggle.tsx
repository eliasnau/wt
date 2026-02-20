"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const themes = [
	{ value: "light", icon: SunIcon, label: "Light" },
	{ value: "dark", icon: MoonIcon, label: "Dark" },
	{ value: "system", icon: MonitorIcon, label: "System" },
] as const;

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className="h-7 w-[6.5rem] rounded-full border bg-muted/50" />;
	}

	return (
		<div className="inline-flex items-center gap-0.5 rounded-full border bg-muted/50 p-0.5">
			{themes.map(({ value, icon: Icon, label }) => (
				<button
					key={value}
					type="button"
					aria-label={label}
					onClick={() => setTheme(value)}
					className={cn(
						"inline-flex size-6 items-center justify-center rounded-full transition-all",
						theme === value
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Icon className="size-3.5" />
				</button>
			))}
		</div>
	);
}
