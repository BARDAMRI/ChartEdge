import {useLayoutEffect, useRef, useState} from "react";
import {CanvasSizes} from "../components/Canvas/ChartStage";

export function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState<CanvasSizes>({width: 0, height: 0});

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ro = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;
            const {width, height} = entry.contentRect;
            setSize({width, height});
        });

        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return {ref, size};
}
