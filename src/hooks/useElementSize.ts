import {useLayoutEffect, useRef, useState} from "react";
import type {RefObject} from "react";
import type {CanvasSizes} from "../types/types";

interface UseElementSizeReturn<T extends HTMLElement> {
    ref: RefObject<T>;
    size: CanvasSizes;
}

/**
 * Measures an element's rendered size (CSS pixels, fractional allowed) using ResizeObserver.
 * - Returns a stable ref to attach to the measured element
 * - Updates on layout changes and window resize (covers DPR/zoom changes)
 */
export function useElementSize<T extends HTMLElement>(): UseElementSizeReturn<T> {
    // Use non-null generic with a non-null assertion to satisfy RefObject<T> while runtime current starts null
    const ref = useRef<T>(null!);
    const [size, setSize] = useState<CanvasSizes>({width: 0, height: 0});

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            const r = el.getBoundingClientRect();
            // Avoid needless state updates
            setSize((prev) => {
                const w = r.width;
                const h = r.height;
                if (prev.width === w && prev.height === h) return prev;
                return {width: w, height: h};
            });
        };

        // Initial measure
        measure();

        // Observe element size changes
        const ro = new ResizeObserver(() => {
            // Coalesce multiple RO callbacks into a single frame
            requestAnimationFrame(measure);
        });
        ro.observe(el);

        // Also react to window resize (covers DPR / zoom switches on many browsers)
        window.addEventListener("resize", measure);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    return {ref, size};
}