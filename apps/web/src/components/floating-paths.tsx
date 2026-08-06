"use client";

import { motion } from "motion/react";

/**
 * Decorative animated background for the auth split panel. `position` flips the
 * curve direction — render it twice (`1` and `-1`) for the mirrored look.
 */
export function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${
      189 + i * 6
    } -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${
      343 - i * 6
    }C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${
      875 - i * 6
    } ${684 - i * 5 * position} ${875 - i * 6}`,
    id: i,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full text-primary" fill="none" viewBox="0 0 696 316">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            animate={{
              opacity: [0.3, 0.6, 0.3],
              pathLength: 1,
              pathOffset: [0, 1, 0],
            }}
            d={path.d}
            initial={{ opacity: 0.6, pathLength: 0.3 }}
            key={path.id}
            stroke="currentColor"
            strokeOpacity={0.1 + path.id * 0.03}
            strokeWidth={path.width}
            transition={{
              duration: 20 + Math.random() * 10,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
