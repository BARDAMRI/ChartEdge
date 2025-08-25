import {useEffect, useRef} from 'react';
import {Interval} from "../types/Interval";
import {TimeRange} from "../types/Graph";

const PAN_SENSITIVITY = 1.0;
const ZOOM_SENSITIVITY = 0.1;
const WHEEL_END_DEBOUNCE = 150; // ms to wait after last wheel event to consider it "ended"

interface PanAndZoomHandlers {
    onPanStart: () => void;
    onPan: (dx: number) => void;
    onPanEnd: (dx: number) => void;
    onWheelStart: () => void;
    onWheelEnd: () => void;
}

export function usePanAndZoom(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isEnabled: boolean,
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    setVisibleRange: (range: TimeRange) => void,
    intervalSeconds: number,
    handlers: PanAndZoomHandlers
) {
    const wheelingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ref to hold latest props/handlers to avoid stale closures in event listeners
    const latestPropsRef = useRef({
        visibleRange,
        setVisibleRange,
        intervalsArray,
        intervalSeconds,
        handlers,
    });

    useEffect(() => {
        latestPropsRef.current = {
            visibleRange,
            setVisibleRange,
            intervalsArray,
            intervalSeconds,
            handlers,
        };
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isEnabled || intervalsArray.length === 0) return;

        const isPanningRef = {current: false};
        const panStartRef = {x: 0};
        let currentPanDx = 0;

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            isPanningRef.current = true;
            panStartRef.x = e.clientX;
            currentPanDx = 0;
            latestPropsRef.current.handlers.onPanStart();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;
            const dx = e.clientX - panStartRef.x;
            currentPanDx = dx;
            latestPropsRef.current.handlers.onPan(dx);
        };

        const stopPanning = () => {
            if (!isPanningRef.current) return;
            isPanningRef.current = false;
            latestPropsRef.current.handlers.onPanEnd(currentPanDx);
        };

        const handleMouseUp = () => stopPanning();
        const handleMouseLeave = () => stopPanning();

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            latestPropsRef.current.handlers.onWheelStart();
            if (wheelingTimeoutRef.current) {
                clearTimeout(wheelingTimeoutRef.current!);
            }
            wheelingTimeoutRef.current = setTimeout(() => {
                latestPropsRef.current.handlers.onWheelEnd();
            }, WHEEL_END_DEBOUNCE);

            const {visibleRange, setVisibleRange, intervalsArray, intervalSeconds} = latestPropsRef.current;
            const isZoomGesture = e.ctrlKey || e.metaKey;
            const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);

            if (isZoomGesture || isVerticalScroll) { // ZOOM
                const duration = visibleRange.end - visibleRange.start;
                const zoomAmount = -duration * ZOOM_SENSITIVITY * (e.deltaY / 100);
                if (Math.abs(e.deltaY) < 1) return;
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseRatio = mouseX / canvas.clientWidth;

                let newStart = visibleRange.start + zoomAmount * mouseRatio;
                let newEnd = visibleRange.end - zoomAmount * (1 - mouseRatio);

                const minDuration = (intervalsArray[1]?.t - intervalsArray[0]?.t || intervalSeconds) * 5;
                if (newEnd - newStart < minDuration) return;

                newStart = Math.max(newStart, intervalsArray[0].t);
                newEnd = Math.min(newEnd, intervalsArray[intervalsArray.length - 1].t);
                setVisibleRange({start: newStart, end: newEnd});
            } else { // PAN
                const duration = visibleRange.end - visibleRange.start;
                const timePerPixel = duration / canvas.clientWidth;
                const timeOffset = e.deltaX * timePerPixel;
                let newStart = visibleRange.start + timeOffset;

                const dataStart = intervalsArray[0].t;
                const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds;
                const minStart = dataStart - (duration - intervalSeconds);
                const maxStart = dataEnd - intervalSeconds;

                newStart = Math.max(minStart, Math.min(newStart, maxStart));
                setVisibleRange({start: newStart, end: newStart + duration});
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('wheel', handleWheel, {passive: false});

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('wheel', handleWheel);
            if (wheelingTimeoutRef.current) {
                clearTimeout(wheelingTimeoutRef.current!);
            }
        };
    }, [canvasRef, isEnabled]);
}