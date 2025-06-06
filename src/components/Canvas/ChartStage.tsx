import React, {useEffect, useRef, useState} from 'react';
import {ChartCanvas} from './ChartCanvas';
import {useChartStore} from "../../store/useChartStore.ts";
import XAxis from "./Axes/XAxis.tsx";
import YAxis from "./Axes/YAxis.tsx";
import '../../styles/Canvas/ChartStage.scss';

export interface CanvasSizes {
    width: number;
    height: number;
}

// Logger utility
class DebugLogger {
    private logs: string[] = [];

    log(message: string, data?: any) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
        this.logs.push(logEntry);
        console.log(message, data);
    }

    getLogs() {
        return this.logs.join('\n\n');
    }

    downloadLogs() {
        const logContent = this.getLogs();
        const blob = new Blob([logContent], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resize-debug-${new Date().toISOString().slice(0, 19)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clear() {
        this.logs = [];
    }
}

const logger = new DebugLogger();

export const ChartStage: React.FC = () => {
    const yAxisPosition = useChartStore(state => state.yAxisPosition);
    const margin = useChartStore(state => state.margin);
    const xAxisHeight = useChartStore(state => state.xAxisHeight);
    const yAxisWidth = useChartStore(state => state.yAxisWidth);
    const [canvasSizes, setCanvasSizes] = useState<CanvasSizes>({width: 0, height: 0});
    const [logCount, setLogCount] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const element = containerRef.current!;

        // Initial size logging
        const initialRect = element.getBoundingClientRect();
        logger.log('🔷 Initial container size:', {
            width: initialRect.width,
            height: initialRect.height,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight
        });

        // Log computed styles that might affect sizing
        const computedStyle = window.getComputedStyle(element);
        logger.log('🔷 Container computed styles:', {
            width: computedStyle.width,
            height: computedStyle.height,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight,
            maxWidth: computedStyle.maxWidth,
            maxHeight: computedStyle.maxHeight,
            boxSizing: computedStyle.boxSizing,
            display: computedStyle.display,
            flexGrow: computedStyle.flexGrow,
            flexShrink: computedStyle.flexShrink,
            flexBasis: computedStyle.flexBasis,
            overflow: computedStyle.overflow
        });

        // Check parent chain
        let parent = element.parentElement;
        let level = 1;
        while (parent && level <= 3) {
            const parentRect = parent.getBoundingClientRect();
            const parentStyle = window.getComputedStyle(parent);
            logger.log(`🔷 Parent ${level} (${parent.className}):`, {
                size: {width: parentRect.width, height: parentRect.height},
                minWidth: parentStyle.minWidth,
                maxWidth: parentStyle.maxWidth,
                display: parentStyle.display,
                overflow: parentStyle.overflow,
                flexGrow: parentStyle.flexGrow,
                flexShrink: parentStyle.flexShrink
            });
            parent = parent.parentElement;
            level++;
        }

        const resizeObserver = new ResizeObserver(entries => {
            logger.log('🟢 ResizeObserver triggered!');
            setLogCount(prev => prev + 1);

            for (let entry of entries) {
                const {width, height} = entry.contentRect;
                const {target} = entry;

                logger.log('🟢 ResizeObserver data:', {
                    contentRect: {width, height},
                    borderBoxSize: entry.borderBoxSize?.[0],
                    contentBoxSize: entry.contentBoxSize?.[0],
                    targetClass: (target as HTMLElement).className,
                    currentCanvasSizes: canvasSizes
                });

                // Also log current element measurements
                const currentRect = element.getBoundingClientRect();
                logger.log('🟢 Current element measurements:', {
                    getBoundingClientRect: {width: currentRect.width, height: currentRect.height},
                    clientSize: {width: element.clientWidth, height: element.clientHeight},
                    offsetSize: {width: element.offsetWidth, height: element.offsetHeight}
                });

                setCanvasSizes(prev => {
                    if (prev.width !== width || prev.height !== height) {
                        logger.log('🔄 Updating canvas sizes:', {
                            from: prev,
                            to: {width, height},
                            change: {
                                width: width - prev.width,
                                height: height - prev.height
                            }
                        });
                        return {width, height};
                    }
                    logger.log('🚫 No size change, keeping previous:', prev);
                    return prev;
                });
            }
        });

        // Add window resize listener for comparison
        const handleWindowResize = () => {
            const windowSize = {width: window.innerWidth, height: window.innerHeight};
            const elementRect = element.getBoundingClientRect();
            logger.log('🌍 Window resize:', {
                window: windowSize,
                element: {width: elementRect.width, height: elementRect.height}
            });
            setLogCount(prev => prev + 1);
        };

        window.addEventListener('resize', handleWindowResize);
        resizeObserver.observe(element);

        logger.log('🔷 ResizeObserver attached to element:', {className: element.className});

        return () => {
            logger.log('🔴 Cleaning up ResizeObserver');
            window.removeEventListener('resize', handleWindowResize);
            resizeObserver.disconnect();
        };
    }, []);

    // Log every render
    logger.log('🔄 ChartStage render:', {
        canvasSizes,
        containerRefCurrent: !!containerRef.current
    });

    return (
        <div
            ref={containerRef}
            style={{margin: `${margin}px`}}
            className="chart-stage-container flex w-full h-full">

            {/*===================== Size indicator and logs downloader for debug  ===================== */}

            {/*/!* Debug controls *!/*/}
            {/*<div style={{*/}
            {/*    position: 'fixed',*/}
            {/*    top: '10px',*/}
            {/*    right: '10px',*/}
            {/*    background: 'white',*/}
            {/*    border: '1px solid #ccc',*/}
            {/*    padding: '10px',*/}
            {/*    borderRadius: '5px',*/}
            {/*    zIndex: 2000,*/}
            {/*    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'*/}
            {/*}}>*/}
            {/*    <div style={{ fontSize: '12px', marginBottom: '5px' }}>*/}
            {/*        Debug Logger ({logCount} events)*/}
            {/*    </div>*/}
            {/*    <button*/}
            {/*        onClick={() => logger.downloadLogs()}*/}
            {/*        style={{*/}
            {/*            padding: '5px 10px',*/}
            {/*            marginRight: '5px',*/}
            {/*            fontSize: '12px',*/}
            {/*            cursor: 'pointer'*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        💾 Download Logs*/}
            {/*    </button>*/}
            {/*    <button*/}
            {/*        onClick={() => {*/}
            {/*            logger.clear();*/}
            {/*            setLogCount(0);*/}
            {/*        }}*/}
            {/*        style={{*/}
            {/*            padding: '5px 10px',*/}
            {/*            fontSize: '12px',*/}
            {/*            cursor: 'pointer'*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        🗑️ Clear*/}
            {/*    </button>*/}
            {/*</div>*/}

            {/*/!* Size indicator *!/*/}
            {/*<div style={{*/}
            {/*    position: 'absolute',*/}
            {/*    top: 0,*/}
            {/*    left: 0,*/}
            {/*    background: 'rgba(255,0,0,0.1)',*/}
            {/*    padding: '4px',*/}
            {/*    fontSize: '12px',*/}
            {/*    zIndex: 1000,*/}
            {/*    pointerEvents: 'none'*/}
            {/*}}>*/}
            {/*    Container: {Math.round(canvasSizes.width)}×{Math.round(canvasSizes.height)}*/}
            {/*</div>*/}


            {/*========================================================================================= */}


            {yAxisPosition === 'left' && (
                <div className="right-y-axis-container relative flex h-full" style={{width: `${yAxisWidth}px`}}>
                    <YAxis containerRef={containerRef} canvasSizes={canvasSizes}/>
                </div>
            )}

            <div className="canvas-axis-container relative flex h-full" style={{
                width: `${canvasSizes.width - (yAxisWidth + 40)}px`,
                marginLeft: `${yAxisPosition === 'left' ? 0 : 40}px`,
                marginRight: `${yAxisPosition === 'right' ? 0 : 40}px`
            }}>
                <div className={`canvas-container relative`}>
                    <ChartCanvas parentContainerRef={containerRef}/>
                </div>
                <div className="x-axis-container absolute bottom-0 left-0 w-full" style={{height: `${xAxisHeight}px`}}>
                    <XAxis containerRef={containerRef} canvasSizes={canvasSizes}/>
                </div>
            </div>

            {yAxisPosition === 'right' && (
                <div className="left-y-axis-container relative flex h-full" style={{width: `${yAxisWidth}px`}}>
                    <YAxis containerRef={containerRef} canvasSizes={canvasSizes}/>
                </div>
            )}
        </div>
    );
};