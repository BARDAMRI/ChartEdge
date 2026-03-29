/**
 * TickUp product lines (tiered charting shells).
 *
 * - **pulse** — minimal embed: plot + axes only (no toolbars). Toolbar chrome is locked; cannot be enabled via props.
 * - **flow** — analysis: symbol bar & settings, no drawing sidebar. Chrome locked.
 * - **command** — full trader UI: drawings, modals, live API. Chrome locked to full toolbars.
 * - **desk** — broker / embedded terminal: same as command + attribution required. Chrome locked.
 * - **prime** — licensed / eval tier: same chrome as command + optional `licenseKey` banner when unset.
 *
 * Product components omit `showSidebar` / `showTopBar` / `showSettingsBar` from their props; use `TickUpHost` without `productId` for a custom layout.
 */
export type TickUpProductId = 'pulse' | 'flow' | 'command' | 'desk' | 'prime';
