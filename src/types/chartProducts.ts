/**
 * ChartEdge product lines (similar idea to tiered charting SDKs elsewhere, with ChartEdge-only naming).
 *
 * - **pulse** — minimal embed: plot + axes only (no toolbars). Toolbar chrome is locked; cannot be enabled via props.
 * - **flow** — analysis: symbol bar & settings, no drawing sidebar. Chrome locked.
 * - **command** — full trader UI: drawings, modals, live API. Chrome locked to full toolbars.
 * - **desk** — broker / embedded terminal: same as command + attribution required. Chrome locked.
 * - **apex** — reserved for premium; optional `licenseKey`. Chrome locked like Command.
 *
 * Product components omit `showSidebar` / `showTopBar` / `showSettingsBar` from their props; use `ChartEdgeHost` without `productId` for a custom layout.
 */
export type ChartEdgeProductId = 'pulse' | 'flow' | 'command' | 'desk' | 'apex';
