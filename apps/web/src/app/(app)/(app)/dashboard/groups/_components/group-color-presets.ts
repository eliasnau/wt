export const GROUP_COLOR_PRESETS = [
	{ name: "Cobalt", hex: "#2563eb" },
	{ name: "Sky", hex: "#0ea5e9" },
	{ name: "Teal", hex: "#14b8a6" },
	{ name: "Emerald", hex: "#10b981" },
	{ name: "Lime", hex: "#84cc16" },
	{ name: "Amber", hex: "#f59e0b" },
	{ name: "Orange", hex: "#f97316" },
	{ name: "Coral", hex: "#fb7185" },
	{ name: "Ruby", hex: "#ef4444" },
	{ name: "Fuchsia", hex: "#d946ef" },
	{ name: "Violet", hex: "#8b5cf6" },
	{ name: "Indigo", hex: "#6366f1" },
] as const;

export const DEFAULT_GROUP_COLOR = GROUP_COLOR_PRESETS[0].hex;

export function getRandomGroupColor(currentColor?: string) {
	const normalizedCurrent = currentColor?.trim().toLowerCase();
	const choices = GROUP_COLOR_PRESETS.map((item) => item.hex).filter(
		(color) => color !== normalizedCurrent,
	);

	if (choices.length === 0) {
		return DEFAULT_GROUP_COLOR;
	}

	const randomIndex = Math.floor(Math.random() * choices.length);
	return choices[randomIndex] ?? DEFAULT_GROUP_COLOR;
}
