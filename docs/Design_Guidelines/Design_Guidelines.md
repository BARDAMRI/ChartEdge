# TickUp Charts — design guidelines

Chart options and modal settings drive most plot colors; the shell uses **styled-components** themed wrappers. Defaults live in **`src/components/DefaultData.ts`**.

## General principles
- Clean and minimal UI
- Focus on clarity and readability
- Subtle animations (no flashy effects)
- Prioritize performance over heavy visual effects

## Colors
- Use neutral backgrounds (light: #ffffff, dark: #121212)
- Grid lines: light grey (#e0e0e0) or dark grey (#303030)
- Primary data lines: accent colors (blue, green)
- Shapes: customizable colors by user

## Typography
- Sans-serif fonts (e.g., Inter, Roboto)
- Font sizes: 12px for regular text, 14px for axis labels
- Good contrast: text color 85-95% darkness/lightness vs. background

## Canvas Behavior
- Responsive resizing
- Maintain aspect ratio during zoom
- Smooth panning without sudden jumps

## Drawing Mode UX
- Highlight active drawing mode
- Show live preview while drawing (e.g., ghost line)
- Snap to data points if enabled
