import React, {useEffect, useRef, useState, useCallback} from 'react';
import {Interval} from "../types/Interval";
import {TimeRange} from "../types/Graph";

const PAN_SENSITIVITY = 1.0; // Sensitivity can be adjusted, 1.0 is direct mapping
const ZOOM_SENSITIVITY = 0.1;

/**
 * Custom hook to manage all pan and zoom logic for the chart.
 * This version is optimized for back-buffer panning.
 */
export function usePanAndZoom(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isEnabled: boolean,
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    setVisibleRange: (range: TimeRange) => void,
    intervalSeconds: number
) {
    const isPanningRef = useRef(false);
    const panStartRef = useRef({x: 0});

    // State to communicate pixel offset to the component
    const [panOffset, setPanOffset] = useState(0);

    const stopPanning = useCallback(() => {
        if (!isPanningRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        isPanningRef.current = false;

        // On mouse up, calculate the final time range and update the state once
        const timePerPixel = (visibleRange.end - visibleRange.start) / canvas.clientWidth;
        const timeOffset = panOffset * timePerPixel * PAN_SENSITIVITY;
        let newStart = visibleRange.start - timeOffset;

        const duration = visibleRange.end - visibleRange.start;
        const dataStart = intervalsArray[0].t;
        const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds;

        const minVisibleSpan = intervalSeconds;
        const minStart = dataStart - (duration - minVisibleSpan);
        const maxStart = dataEnd - minVisibleSpan;

        if (newStart < minStart) newStart = minStart;
        if (newStart > maxStart) newStart = maxStart;

        // Finalize the pan
        setVisibleRange({start: newStart, end: newStart + duration});

        // Reset pixel offset after the state is finalized
        setPanOffset(0);

    }, [canvasRef, panOffset, visibleRange, setVisibleRange, intervalsArray, intervalSeconds]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isEnabled || !intervalsArray.length) return;

        const handleMouseDown = (e: MouseEvent) => {
            isPanningRef.current = true;
            panStartRef.current = {x: e.clientX};
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;

            const dx = e.clientX - panStartRef.current.x;
            setPanOffset(dx);
        };

        const handleMouseUp = () => {
            stopPanning();
        };

        const handleMouseLeave = () => {
            // Optional: if mouse leaves canvas, stop panning
            stopPanning();
        };


        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Zooming logic remains the same, as it requires a full data recalculation
            if (e.ctrlKey || e.metaKey) {
                const duration = visibleRange.end - visibleRange.start;
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
                // Scroll-panning can remain as is, as it's less prone to high-frequency updates than mouse drag
                const duration = visibleRange.end - visibleRange.start;
                const timePerPixel = duration / canvas.clientWidth;
                const timeOffset = (e.deltaX + e.deltaY) * timePerPixel;

                let newStart = visibleRange.start + timeOffset;

                const dataStart = intervalsArray[0].t;
                const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds;

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
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('wheel', handleWheel, {passive: false});

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [canvasRef, isEnabled, intervalsArray, visibleRange, setVisibleRange, stopPanning]);

    return {panOffset, isPanning: isPanningRef.current};
}