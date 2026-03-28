import {CHARTEDGE_MARK_URL_DARK, CHARTEDGE_MARK_URL_LIGHT} from './chartEdgeWatermarkAssets';

export type ChartEdgeWatermarkTheme = 'light' | 'dark';

export type ChartEdgeWatermarkImages = {
    light: HTMLImageElement;
    dark: HTMLImageElement;
};

let cached: ChartEdgeWatermarkImages | null = null;
let loading: Promise<ChartEdgeWatermarkImages | null> | null = null;

/**
 * Loads the bundled ChartEdge mark images once (for canvas drawImage).
 */
export function loadChartEdgeWatermarkImages(): Promise<ChartEdgeWatermarkImages | null> {
    if (cached) {
        return Promise.resolve(cached);
    }
    if (!loading) {
        loading = new Promise((resolve) => {
            const light = new Image();
            const dark = new Image();
            let done = 0;
            const finish = () => {
                done += 1;
                if (done < 2) {
                    return;
                }
                if (light.naturalWidth > 0 && dark.naturalWidth > 0) {
                    cached = {light, dark};
                    resolve(cached);
                } else {
                    resolve(null);
                }
            };
            light.onload = finish;
            dark.onload = finish;
            light.onerror = finish;
            dark.onerror = finish;
            light.src = CHARTEDGE_MARK_URL_LIGHT;
            dark.src = CHARTEDGE_MARK_URL_DARK;
        });
    }
    return loading;
}

export type DrawWatermarkOptions = {
    /** Max width as fraction of canvas width (default 0.36). */
    maxWidthFrac?: number;
    /** Global alpha (default 0.13 main plot, use ~0.09 for histogram). */
    opacity?: number;
    padding?: number;
    /** Default bottom-right (price pane); bottom-left fits volume gutter. */
    placement?: 'bottom-right' | 'bottom-left';
};

/**
 * Draws the mark bottom-right, behind series (call before OHLC). Uses low opacity.
 */
export function drawChartEdgeWatermark(
    ctx: CanvasRenderingContext2D,
    cssWidth: number,
    cssHeight: number,
    theme: ChartEdgeWatermarkTheme,
    images: ChartEdgeWatermarkImages | null,
    options?: DrawWatermarkOptions
): void {
    if (!images || cssWidth < 40 || cssHeight < 24) {
        return;
    }
    const img = theme === 'dark' ? images.dark : images.light;
    if (!img.complete || img.naturalWidth === 0) {
        return;
    }

    const maxWidthFrac = options?.maxWidthFrac ?? 0.36;
    const opacity = options?.opacity ?? 0.13;
    const pad = options?.padding ?? 8;

    const maxW = Math.min(168, cssWidth * maxWidthFrac);
    const scale = maxW / img.naturalWidth;
    const w = maxW;
    const h = img.naturalHeight * scale;

    const placement = options?.placement ?? 'bottom-right';
    const x =
        placement === 'bottom-left'
            ? pad
            : Math.max(pad, cssWidth - w - pad);
    const y = Math.max(pad, cssHeight - h - pad);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
}
