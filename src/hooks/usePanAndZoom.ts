import React, {useEffect, useRef} from 'react';
import {Interval} from "../types/Interval";
import {TimeRange} from "../types/Graph";

const PAN_SENSITIVITY = 0.5;
const ZOOM_SENSITIVITY = 0.1;

/**
 * Custom hook to manage all pan and zoom logic for the chart.
 */
export function usePanAndZoom(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isEnabled: boolean,
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    setVisibleRange: (range: TimeRange) => void,
    intervalSeconds: number
) {
    const isPanning = useRef(false);
    const panStart = useRef({x: 0, time: 0});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isEnabled || !intervalsArray.length) return;

        // Mousedown for click-and-drag panning
        const handleMouseDown = (e: MouseEvent) => {
            isPanning.current = true;
            panStart.current = {x: e.clientX, time: visibleRange.start};
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanning.current) return;

            const dx = e.clientX - panStart.current.x;
            const timePerPixel = (visibleRange.end - visibleRange.start) / canvas.clientWidth;
            const timeOffset = dx * timePerPixel * PAN_SENSITIVITY;
            let newStart = panStart.current.time - timeOffset;

            const duration = visibleRange.end - visibleRange.start;
            const dataStart = intervalsArray[0].t;
            const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds;

            // Allow panning as long as at least one interval remains visible
            const minVisibleSpan = intervalSeconds;
            const minStart = dataStart - (duration - minVisibleSpan);
            const maxStart = dataEnd - minVisibleSpan;

            if (newStart < minStart) newStart = minStart;
            if (newStart > maxStart) newStart = maxStart;

            setVisibleRange({start: newStart, end: newStart + duration});
        };

        const handleMouseUp = () => {
            isPanning.current = false;
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const duration = visibleRange.end - visibleRange.start;

            // Check for pinch-to-zoom gesture (ctrlKey or metaKey is true on trackpads)
            if (e.ctrlKey || e.metaKey) {
                const zoomAmount = -duration * ZOOM_SENSITIVITY * (e.deltaY / 100);
                if (Math.abs(e.deltaY) < 1) return;
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseRatio = mouseX / canvas.clientWidth;

                let newStart = visibleRange.start + zoomAmount * mouseRatio;
                let newEnd = visibleRange.end - zoomAmount * (1 - mouseRatio);

                newStart = Math.max(newStart, intervalsArray[0].t);
                newEnd = Math.min(newEnd, intervalsArray[intervalsArray.length - 1].t);

                const minDuration = (intervalsArray[1].t - intervalsArray[0].t) * 1.5;
                if (newEnd - newStart < minDuration) {
                    const center = (newStart + newEnd) / 2;
                    newStart = center - minDuration / 2;
                    newEnd = center + minDuration / 2;
                }

                setVisibleRange({start: newStart, end: newEnd});

            } else {
                // Handle two-finger scroll for panning
                const timePerPixel = duration / canvas.clientWidth;
                const timeOffset = (e.deltaX + e.deltaY) * timePerPixel * PAN_SENSITIVITY;

                let newStart = visibleRange.start + timeOffset;

                const dataStart = intervalsArray[0].t;
                const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds; // include last interval end

                // Allow panning as long as at least one interval remains visible
                const minVisibleSpan = intervalSeconds;
                const minStart = dataStart - (duration - minVisibleSpan);
                const maxStart = dataEnd - minVisibleSpan;

                if (newStart < minStart) newStart = minStart;
                if (newStart > maxStart) newStart = maxStart;

                setVisibleRange({start: newStart, end: newStart + duration});
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, {passive: false});

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [canvasRef, isEnabled, intervalsArray, visibleRange, setVisibleRange]);
}