/**
 * Bundled raster brand URLs for Vite library builds (emitted under `dist/assets/`).
 * Prefer **transparent** PNGs so plates and chart backgrounds show through.
 *
 * - **Wordmarks:** light-optimized on light UI, dark-optimized on dark UI, gradient on grey/neutral.
 * - **Canvas watermarks:** icon tuned for plot background (light vs dark theme).
 */
import tickupLogoLightTransparentUrl from '../assets/brand/logos/tickup-logo-full-light-transparent.png?url';
import tickupLogoDarkTransparentUrl from '../assets/brand/logos/tickup-logo-full-dark-transparent.png?url';
import tickupLogoGradientTransparentUrl from '../assets/brand/logos/tickup-logo-full-brand-gradient-transparent.png?url';
import tickupIconForLightPlotUrl from '../assets/brand/icons/tickup-icon-transparent.png?url';
import tickupIconForDarkPlotUrl from '../assets/brand/icons/tickup-icon-dark-transparent.png?url';

/** Toolbar / attribution wordmark — light surfaces */
export const TICKUP_WORDMARK_URL_LIGHT = tickupLogoLightTransparentUrl;
/** Mid-tone / grey shell or marketing blocks */
export const TICKUP_WORDMARK_URL_GREY = tickupLogoGradientTransparentUrl;
/** Toolbar / attribution wordmark — dark surfaces */
export const TICKUP_WORDMARK_URL_DARK = tickupLogoDarkTransparentUrl;

/** In-canvas watermark on light / grey plot */
export const TICKUP_WATERMARK_URL_LIGHT = tickupIconForLightPlotUrl;
/** In-canvas watermark on dark plot */
export const TICKUP_WATERMARK_URL_DARK = tickupIconForDarkPlotUrl;
/** Grey chart theme — same glyph weight as light plots */
export const TICKUP_WATERMARK_URL_GREY = tickupIconForLightPlotUrl;
