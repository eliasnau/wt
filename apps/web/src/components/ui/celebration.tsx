"use client";

import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** `major` = awesome events (new member). `minor` = routine good events (saved). */
export type CelebrationVariant = "major" | "minor";

/** Where a burst starts from: an explicit point, or an element to center on. */
type OriginInput = { x: number; y: number } | HTMLElement | null | undefined;
type Point = { x: number; y: number };

type Confetto = {
	id: number;
	ox: number; // origin, viewport px
	oy: number;
	width: number;
	height: number;
	color: string;
	delay: number;
	duration: number;
	midX: number; // offset at the top of the arc / burst, px
	midY: number;
	endX: number; // final offset, px
	endY: number;
	rotate: number;
	rounded: boolean;
};

// Shades of one emerald, for depth without going rainbow.
const COLORS = [
	"var(--color-emerald-300)",
	"var(--color-emerald-400)",
	"var(--color-emerald-500)",
	"var(--color-emerald-600)",
];

type VariantConfig = {
	origin: "corners" | "center";
	count: number;
	minSize: number;
	maxSize: number;
	horizBase: number; // px
	horizSpan: number; // × viewport width
	apexBase: number; // px up
	apexSpan: number;
	durBase: number; // s
	durSpan: number;
};

const VARIANTS: Record<CelebrationVariant, VariantConfig> = {
	major: {
		origin: "corners",
		count: 56,
		minSize: 3,
		maxSize: 6,
		horizBase: 60,
		horizSpan: 0.5,
		apexBase: 200,
		apexSpan: 360,
		durBase: 1.1,
		durSpan: 0.8,
	},
	minor: {
		origin: "center",
		count: 18,
		minSize: 3,
		maxSize: 5,
		horizBase: 20,
		horizSpan: 0.16,
		apexBase: 120,
		apexSpan: 170,
		durBase: 0.9,
		durSpan: 0.5,
	},
};

function resolveOrigin(origin: OriginInput): Point | undefined {
	if (!origin) return undefined;
	if (origin instanceof HTMLElement) {
		const r = origin.getBoundingClientRect();
		return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
	}
	return { x: origin.x, y: origin.y };
}

function createConfetti(
	variant: CelebrationVariant,
	vw: number,
	vh: number,
	origin?: Point,
): Confetto[] {
	const cfg = VARIANTS[variant];

	const base = (id: number) => {
		const width = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
		return {
			id,
			width,
			height: width * (1.2 + Math.random() * 0.9),
			color: COLORS[id % COLORS.length],
			delay: Math.random() * 0.12,
			duration: cfg.durBase + Math.random() * cfg.durSpan,
			rotate: (Math.random() - 0.5) * 720,
			rounded: Math.random() > 0.7,
		};
	};

	// Radial pop from a point (minor, when a click origin is supplied).
	if (origin && cfg.origin !== "corners") {
		return Array.from({ length: cfg.count }, (_, i) => {
			const theta = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7; // upward fan
			const r = 45 + Math.random() * 75;
			const midX = Math.cos(theta) * r;
			const midY = Math.sin(theta) * r;
			const gravity = 130 + Math.random() * 170;
			return {
				...base(i),
				ox: origin.x,
				oy: origin.y,
				midX,
				midY,
				endX: midX * 1.25 + (Math.random() - 0.5) * 30,
				endY: midY + gravity,
			};
		});
	}

	// Arc emission: shoot up-and-out, then gravity arcs it back down off-screen.
	const arc = (id: number, ox: number, oy: number, dir: number): Confetto => {
		const horiz = cfg.horizBase + Math.random() * vw * cfg.horizSpan;
		return {
			...base(id),
			ox,
			oy,
			midX: dir * horiz,
			midY: -(cfg.apexBase + Math.random() * cfg.apexSpan),
			endX: dir * (horiz + 20 + Math.random() * vw * 0.18),
			endY: 60, // just past the origin baseline (screen bottom)
		};
	};

	if (cfg.origin === "corners") {
		const per = Math.round(cfg.count / 2);
		return [
			...Array.from({ length: per }, (_, i) => arc(i, 0, vh, 1)),
			...Array.from({ length: per }, (_, i) => arc(per + i, vw, vh, -1)),
		];
	}
	// center fountain (minor with no click origin)
	return Array.from({ length: cfg.count }, (_, i) =>
		arc(i, vw / 2, vh, Math.random() > 0.5 ? 1 : -1),
	);
}

function SuccessBurst({
	variant,
	origin,
	onComplete,
}: {
	variant: CelebrationVariant;
	origin?: Point;
	onComplete: () => void;
}) {
	const reduced = useReducedMotion();
	const confetti = React.useMemo(() => {
		const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
		const vh = typeof window === "undefined" ? 800 : window.innerHeight;
		return createConfetti(variant, vw, vh, origin);
	}, [variant, origin]);

	React.useEffect(() => {
		const longest = confetti.reduce(
			(max, c) => Math.max(max, c.delay + c.duration),
			0,
		);
		const timeout = window.setTimeout(
			onComplete,
			reduced ? 0 : longest * 1000 + 100,
		);
		return () => window.clearTimeout(timeout);
	}, [onComplete, reduced, confetti]);

	// Respect reduced-motion: the toast still fires, so feedback isn't lost.
	if (reduced) return null;

	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
		>
			{confetti.map((c) => (
				<motion.span
					key={c.id}
					className={cn(
						"absolute",
						c.rounded ? "rounded-full" : "rounded-[1px]",
					)}
					style={{
						left: c.ox,
						top: c.oy,
						width: c.width,
						height: c.height,
						marginLeft: -c.width / 2,
						marginTop: -c.height / 2,
						backgroundColor: c.color,
					}}
					initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
					animate={{
						x: [0, c.midX, c.endX],
						y: [0, c.midY, c.endY],
						opacity: [0, 1, 1, 0],
						rotate: c.rotate,
					}}
					transition={{
						x: {
							duration: c.duration,
							delay: c.delay,
							ease: ["easeOut", "easeIn"],
							times: [0, 0.42, 1],
						},
						y: {
							duration: c.duration,
							delay: c.delay,
							ease: ["easeOut", "easeIn"],
							times: [0, 0.42, 1],
						},
						opacity: {
							duration: c.duration,
							delay: c.delay,
							times: [0, 0.06, 0.72, 1],
						},
						rotate: { duration: c.duration, delay: c.delay, ease: "linear" },
					}}
				/>
			))}
		</div>
	);
}

type Burst = { id: number; variant: CelebrationVariant; origin?: Point };

/**
 * Fire-and-forget celebration for genuinely earned moments. Render `celebration`
 * once in the component and call `celebrate(variant, origin)` from a mutation's
 * onSuccess. `origin` (a point or element) makes the burst start there — nice for
 * `minor`, which otherwise falls back to a center fountain. Defaults to `minor`.
 */
export function useCelebration() {
	const [bursts, setBursts] = React.useState<Burst[]>([]);

	const celebrate = React.useCallback(
		(variant: CelebrationVariant = "minor", origin?: OriginInput) => {
			setBursts((prev) => [
				...prev,
				{
					id: Date.now() + Math.random(),
					variant,
					origin: resolveOrigin(origin),
				},
			]);
		},
		[],
	);

	const remove = React.useCallback((id: number) => {
		setBursts((prev) => prev.filter((burst) => burst.id !== id));
	}, []);

	const celebration = (
		<>
			{bursts.map((burst) => (
				<SuccessBurst
					key={burst.id}
					variant={burst.variant}
					origin={burst.origin}
					onComplete={() => remove(burst.id)}
				/>
			))}
		</>
	);

	return { celebrate, celebration };
}

export type CelebrateButtonHandle = { celebrate: () => void };

type CelebrateButtonProps = Omit<React.ComponentProps<typeof Button>, "ref"> & {
	/** Celebration intensity. Defaults to `minor`. */
	tier?: CelebrationVariant;
	/** `button` bursts from the button itself; `screen` uses the variant default. */
	origin?: "button" | "screen";
	/** Fire on click instead of via the imperative handle (for instant actions). */
	celebrateOnClick?: boolean;
};

/**
 * A Button that owns its own celebration — no `useCelebration` wiring at the call
 * site. For async work (a mutation), grab a ref and call `ref.current.celebrate()`
 * in onSuccess so it only fires on success. For instant actions, set
 * `celebrateOnClick`. `origin="button"` makes the burst bloom from the button.
 */
export const CelebrateButton = React.forwardRef<
	CelebrateButtonHandle,
	CelebrateButtonProps
>(function CelebrateButton(
	{
		tier = "minor",
		origin = "button",
		celebrateOnClick = false,
		onClick,
		...props
	},
	ref,
) {
	const { celebrate, celebration } = useCelebration();
	const originRef = React.useRef<Point | null>(null);

	const fire = React.useCallback(() => {
		celebrate(tier, origin === "button" ? originRef.current : undefined);
	}, [celebrate, tier, origin]);

	const handleClick = React.useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (origin === "button") {
				const r = e.currentTarget.getBoundingClientRect();
				originRef.current = {
					x: r.left + r.width / 2,
					y: r.top + r.height / 2,
				};
			}
			onClick?.(e);
			if (celebrateOnClick) fire();
		},
		[onClick, origin, celebrateOnClick, fire],
	);

	React.useImperativeHandle(ref, () => ({ celebrate: fire }), [fire]);

	return (
		<>
			{celebration}
			<Button {...props} onClick={handleClick} />
		</>
	);
});

export { SuccessBurst };
