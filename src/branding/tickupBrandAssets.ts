/**
 * Bundled raster brand URLs for Vite library builds (emitted under `dist/assets/`).
 */
import tickupLogoGradientUrl from '../assets/brand/logos/tickup-logo-full-brand-gradient.png?url';
import tickupLogoDarkUrl from '../assets/brand/logos/tickup-logo-full-dark.png?url';
import tickupIconTransparentUrl from '../assets/brand/icons/tickup-icon-transparent.png?url';

/** Toolbar / attribution wordmark — light and grey chart themes */
export const TICKUP_WORDMARK_URL_LIGHT = tickupLogoGradientUrl;
export const TICKUP_WORDMARK_URL_GREY = tickupLogoGradientUrl;
/** Toolbar / attribution wordmark — dark shell */
export const TICKUP_WORDMARK_URL_DARK = tickupLogoDarkUrl;

/** In-canvas watermark (single asset for all chart themes) */
export const TICKUP_WATERMARK_URL_LIGHT = tickupIconTransparentUrl;
export const TICKUP_WATERMARK_URL_DARK = tickupIconTransparentUrl;
export const TICKUP_WATERMARK_URL_GREY = tickupIconTransparentUrl;
