import type { Variants } from "framer-motion";

/**
 * Shared cinematic motion presets.
 *
 * One vocabulary for the whole site: editorial reveals that rise and settle,
 * staggered groups, and a soft scale for media. Every preset uses transform
 * and opacity only, so animation stays on the compositor and cheap on mobile.
 * Framer Motion honours the visitor's reduced-motion setting globally via
 * MotionConfig in the root route; these presets add nothing that bypasses it.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Single element: rise 16px and fade in. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Parent that staggers its children's `show` state. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/** Media (maps, charts): fade with a barely-there scale settle. */
export const mediaIn: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE_OUT } },
};

/** Card hover lift — pair with `whileHover` on a motion element. */
export const hoverLift = { y: -4, transition: { duration: 0.25, ease: EASE_OUT } };

/** Viewport reveal props: animate once when ~20% visible. */
export const revealProps = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.2 },
} as const;
