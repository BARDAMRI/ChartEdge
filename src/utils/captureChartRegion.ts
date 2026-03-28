/**
 * Metadata embedded in snapshot images and encoded into suggested download file names.
 */
export interface ChartSnapshotMeta {
    symbol: string;
    visibleTimeStartSec: number;
    visibleTimeEndSec: number;
    intervalSeconds: number;
    chartType: string;
    barsInView: number;
    totalBarsInSeries: number;
    /** Y-axis visible range at capture time (analysis context). */
    visiblePriceMin: number;
    visiblePriceMax: number;
    capturedAtMs: number;
}

function luminance(hex: string): number {
    const m = hex.replace('#', '').trim();
    const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    if (full.length !== 6) return 0.5;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastingFooterTextColor(backgroundCss: string, axesTextFallback = '#1a1a1a'): string {
    const hex = backgroundCss.trim();
    if (hex.startsWith('#') && (hex.length === 4 || hex.length === 7)) {
        return luminance(hex) > 0.55 ? '#1a1a2e' : '#e8eaed';
    }
    if (hex === 'white' || hex === '#fff' || hex === '#ffffff') return '#1a1a2e';
    if (hex === 'black' || hex === '#000' || hex === '#000000') return '#e8eaed';
    return axesTextFallback;
}

function formatIntervalHuman(sec: number): string {
    const s = Math.max(1, Math.round(sec));
    if (s % 86400 === 0) return `${s / 86400}d`;
    if (s % 3600 === 0) return `${s / 3600}h`;
    if (s % 60 === 0) return `${s / 60}m`;
    return `${s}s`;
}

function isoUtc(sec: number): string {
    try {
        return new Date(Math.round(sec) * 1000).toISOString();
    } catch {
        return String(sec);
    }
}

/** Safe single token for file names (ASCII, no path chars). */
export function sanitizeChartSnapshotToken(raw: string, maxLen: number): string {
    const t = (raw || 'unknown')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, maxLen);
    return t || 'unknown';
}

/**
 * File name encodes symbol, unix time range, bar period, chart kind, Y window (min/max × 1000, int), and capture instant.
 * Example: `AAPL_t1688000000-1688060000_iv300s_y98765-102340_candle_cap2025-03-28T12-34-56-789Z.png`
 */
export function buildChartSnapshotFileName(meta: ChartSnapshotMeta): string {
    const sym = sanitizeChartSnapshotToken(meta.symbol, 28);
    const t0 = Math.round(meta.visibleTimeStartSec);
    const t1 = Math.round(meta.visibleTimeEndSec);
    const iv = Math.max(1, Math.round(meta.intervalSeconds));
    const ct = sanitizeChartSnapshotToken(meta.chartType, 20);
    const cap = new Date(meta.capturedAtMs).toISOString().replace(/[:.]/g, '-');
    const ymin = Math.round(meta.visiblePriceMin * 1000);
    const ymax = Math.round(meta.visiblePriceMax * 1000);
    return `${sym}_t${t0}-${t1}_iv${iv}s_y${ymin}-${ymax}_${ct}_cap${cap}.png`;
}

export interface CaptureChartRegionOptions {
    /** When set, a footer strip with human-readable metadata is drawn under the chart bitmap. */
    meta?: ChartSnapshotMeta | null;
    footerTextColor?: string;
}

/**
 * Rasterize all descendant canvases inside `root` into one PNG (axes + stacked chart layers).
 * Skips the interaction overlay canvas (crosshair / pan), which is not part of the data display.
 */
export function captureChartRegionToPngDataUrl(
    root: HTMLElement | null,
    backgroundColor: string,
    options?: CaptureChartRegionOptions
): string | null {
    if (!root) {
        return null;
    }

    const cw = root.clientWidth;
    const ch = root.clientHeight;
    if (cw < 2 || ch < 2) {
        return null;
    }

    const scale = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(cw * scale));
    const H = Math.max(1, Math.round(ch * scale));

    const meta = options?.meta ?? null;
    const lineHeightCss = 15;
    const paddingCss = 10;
    const lines = meta
        ? [
              `Symbol: ${meta.symbol} | Chart: ${meta.chartType} | Bar interval: ${
                  meta.intervalSeconds
              }s (${formatIntervalHuman(meta.intervalSeconds)})`,
              `Visible range (UTC): ${isoUtc(meta.visibleTimeStartSec)} → ${isoUtc(
                  meta.visibleTimeEndSec
              )} | unix_sec: ${Math.round(meta.visibleTimeStartSec)}–${Math.round(meta.visibleTimeEndSec)}`,
              `Y-axis window: ${meta.visiblePriceMin} – ${meta.visiblePriceMax} | Bars in view: ${
                  meta.barsInView
              } | Series bars: ${meta.totalBarsInSeries} | Captured (UTC): ${new Date(meta.capturedAtMs).toISOString()}`,
          ]
        : [];
    const footerCss = meta ? paddingCss * 2 + lines.length * lineHeightCss : 0;
    const footerH = Math.round(footerCss * scale);

    const out = document.createElement('canvas');
    out.width = W;
    out.height = H + footerH;
    const ctx = out.getContext('2d');
    if (!ctx) {
        return null;
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, out.width, out.height);

    const rootBox = root.getBoundingClientRect();
    const canvases = root.querySelectorAll('canvas');

    for (const node of canvases) {
        if (!(node instanceof HTMLCanvasElement)) {
            continue;
        }
        if (node.classList.contains('drawing-interaction-canvas')) {
            continue;
        }
        if (node.width === 0 || node.height === 0) {
            continue;
        }

        const cb = node.getBoundingClientRect();
        const dx = Math.round((cb.left - rootBox.left) * scale);
        const dy = Math.round((cb.top - rootBox.top) * scale);
        const dw = Math.round(cb.width * scale);
        const dh = Math.round(cb.height * scale);

        try {
            ctx.drawImage(node, 0, 0, node.width, node.height, dx, dy, dw, dh);
        } catch {
            // Tainted canvas (e.g. cross-origin); skip layer
        }
    }

    if (meta && lines.length) {
        const textColor = options?.footerTextColor ?? contrastingFooterTextColor(backgroundColor);
        const fontPx = Math.max(10, Math.round(11 * scale));
        ctx.font = `400 ${fontPx}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'top';
        const pad = Math.round(paddingCss * scale);
        let y = H + pad;
        const lineStep = Math.round(lineHeightCss * scale);
        const maxW = W - pad * 2;
        for (const line of lines) {
            let draw = line;
            if (ctx.measureText(draw).width > maxW) {
                const ell = '…';
                let lo = 0;
                let hi = line.length;
                while (lo < hi) {
                    const mid = Math.ceil((lo + hi) / 2);
                    if (ctx.measureText(line.slice(0, mid) + ell).width <= maxW) lo = mid;
                    else hi = mid - 1;
                }
                draw = line.slice(0, lo) + ell;
            }
            ctx.fillText(draw, pad, y);
            y += lineStep;
        }
    }

    try {
        return out.toDataURL('image/png');
    } catch {
        return null;
    }
}
