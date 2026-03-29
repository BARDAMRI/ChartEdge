import {
    TICKUP_WATERMARK_URL_DARK,
    TICKUP_WATERMARK_URL_GREY,
    TICKUP_WATERMARK_URL_LIGHT,
} from './tickupBrandAssets';

export type TickUpWatermarkTheme = 'light' | 'dark' | 'grey';

export type TickUpWatermarkImages = {
    light: HTMLImageElement;
    dark: HTMLImageElement;
    grey: HTMLImageElement;
};

let cached: TickUpWatermarkImages | null = null;
let loading: Promise<TickUpWatermarkImages | null> | null = null;

/**
 * Loads the bundled TickUp mark images once (for canvas drawImage).
 */
export function loadTickUpWatermarkImages(): Promise<TickUpWatermarkImages | null> {
    if (cached) {
        return Promise.resolve(cached);
    }
    if (!loading) {
        loading = new Promise((resolve) => {
            const light = new Image();
            const dark = new Image();
            const grey = new Image();
            let done = 0;
            const finish = () => {
                done += 1;
                if (done < 3) {
                    return;
                }
                if (light.naturalWidth > 0 && dark.naturalWidth > 0 && grey.naturalWidth > 0) {
                    cached = {light, dark, grey};
                    resolve(cached);
                } else {
                    resolve(null);
                }
            };
            light.onload = finish;
            dark.onload = finish;
            grey.onload = finish;
            light.onerror = finish;
            dark.onerror = finish;
            grey.onerror = finish;
            light.src = TICKUP_WATERMARK_URL_LIGHT;
            dark.src = TICKUP_WATERMARK_URL_DARK;
            grey.src = TICKUP_WATERMARK_URL_GREY;
        });
    }
    return loading;
}

export type DrawWatermarkOptions = {
    maxWidthFrac?: number;
    opacity?: number;
    padding?: number;
    placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
};

/**
 * Draws the mark on the canvas (before series). Opacity is caller-controlled.
 */
export function drawTickUpWatermark(
    ctx: CanvasRenderingContext2D,
    cssWidth: number,
    cssHeight: number,
    theme: TickUpWatermarkTheme,
    images: TickUpWatermarkImages | null,
    options?: DrawWatermarkOptions
): void {
    if (!images || cssWidth < 40 || cssHeight < 24) {
        return;
    }
    const img =
        theme === 'dark' ? images.dark : theme === 'grey' ? images.grey : images.light;
    if (!img.complete || img.naturalWidth === 0) {
        return;
    }

    // ─── WATERMARK SIZE KNOBS ───────────────────────────────────────────────
    // maxWidthFrac  – fraction of canvas width the mark may occupy (0..1)
    //                 default 0.70 → up to 70 % of the plot width
    // maxW cap      – hard pixel ceiling (second arg of Math.min)
    //                 raise this number to allow the mark to grow larger
    // ─────────────────────────────────────────────────────────────────────────
    const maxWidthFrac = options?.maxWidthFrac ?? 0.70;
    const opacity = options?.opacity ?? 0.13;
    const pad = options?.padding ?? 8;

    const maxW = Math.min(600, cssWidth * maxWidthFrac);
    const scale = maxW / img.naturalWidth;
    const w = maxW;
    const h = img.naturalHeight * scale;

    const placement = options?.placement ?? 'center';
    let x: number;
    let y: number;
    if (placement === 'center') {
        x = (cssWidth - w) / 2;
        y = (cssHeight - h) / 2;
    } else {
        const isLeft = placement === 'bottom-left' || placement === 'top-left';
        x = isLeft ? pad : Math.max(pad, cssWidth - w - pad);
        const isTop = placement === 'top-left' || placement === 'top-right';
        y = isTop ? pad : Math.max(pad, cssHeight - h - pad);
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
}
