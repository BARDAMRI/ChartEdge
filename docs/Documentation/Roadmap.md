# Project roadmap (informal)

> For a narrative roadmap, see **[`../Project_Roadmap/Project_Roadmap.md`](../Project_Roadmap/Project_Roadmap.md)**. For npm release process, see root **`README.md`**.

This checklist is **historical**; many items below are **already implemented** in the current codebase (drawings, pan/zoom, themes, live merge, PNG snapshot helpers, histogram, overlays, settings modal). Treat it as a snapshot, not the source of truth.

- [x] Candlestick, line, area, bar chart types  
- [x] Grid + axes + histogram  
- [x] Drawing tools (lines, rectangles, circles, triangles, angles, arrows, polylines, custom symbols)  
- [x] Real-time / streaming via **`applyLiveData`** (`mergeByTime`, `append`, …)  
- [x] Theming (light / dark / grey chart theme + shell toggle)  
- [x] Zoom & pan on the main plot  
- [x] Export chart region / snapshot helpers + toolbar CSV  
- [ ] Optional plugin system for third-party indicators (beyond built-in overlay kinds)  
- [ ] Expanded automated test coverage (Jest is configured in-repo)  

When in doubt, inspect **`src/`** and **[`../../documentation/`](../../documentation/README.md)**.
