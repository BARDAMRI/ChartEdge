/**
 * ChartEdge wordmark SVGs (same artwork as `src/assets/chartedge/*.svg`), embedded so the library
 * bundle does not depend on Vite asset URLs. Used for the in-canvas watermark.
 */
export const CHARTEDGE_MARK_SVG_LIGHT = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="22" fill="none" viewBox="0 0 200 22">
  <path fill="#0969da" d="M2 16V6h2.2l3.3 5.5L11 6h2.2v10h-2v-6.2L8.2 15h-1.2L4.1 9.8V16H2z"/>
  <path fill="#0969da" d="M14 6h2v10h-2V6z" opacity=".85"/>
  <text x="20" y="16" fill="#1f2328" style="font-size:15px;font-weight:700;font-family:system-ui,Segoe UI,sans-serif">ChartEdge</text>
  <text x="20" y="21" fill="#656d76" style="font-size:5.5px;font-weight:500;font-family:system-ui,Segoe UI,sans-serif;letter-spacing:.04em">&#169; ChartEdge</text>
</svg>`;

export const CHARTEDGE_MARK_SVG_DARK = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="22" fill="none" viewBox="0 0 200 22">
  <path fill="#58a6ff" d="M2 16V6h2.2l3.3 5.5L11 6h2.2v10h-2v-6.2L8.2 15h-1.2L4.1 9.8V16H2z"/>
  <path fill="#58a6ff" d="M14 6h2v10h-2V6z" opacity=".85"/>
  <text x="20" y="16" fill="#e6edf3" style="font-size:15px;font-weight:700;font-family:system-ui,Segoe UI,sans-serif">ChartEdge</text>
  <text x="20" y="21" fill="#8b949e" style="font-size:5.5px;font-weight:500;font-family:system-ui,Segoe UI,sans-serif;letter-spacing:.04em">&#169; ChartEdge</text>
</svg>`;

function toDataUrl(svg: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const CHARTEDGE_MARK_URL_LIGHT = toDataUrl(CHARTEDGE_MARK_SVG_LIGHT);
export const CHARTEDGE_MARK_URL_DARK = toDataUrl(CHARTEDGE_MARK_SVG_DARK);
