import React, {forwardRef} from 'react';
import {
    ChartEdgeHost,
    type ChartEdgeHostHandle,
    type ChartEdgeHostProps,
} from './SimpleChartEdge';

/** Props disallowed on tier components: chrome is fixed per product (not overridable at init). */
type ChartEdgeProductChromeKeys = 'productId' | 'showSidebar' | 'showTopBar' | 'showSettingsBar';

export type ChartEdgePulseProps = Omit<ChartEdgeHostProps, ChartEdgeProductChromeKeys | 'licenseKey'>;
export type ChartEdgeFlowProps = Omit<ChartEdgeHostProps, ChartEdgeProductChromeKeys | 'licenseKey'>;
export type ChartEdgeCommandProps = Omit<ChartEdgeHostProps, ChartEdgeProductChromeKeys | 'licenseKey'>;
export type ChartEdgeDeskProps = Omit<ChartEdgeHostProps, ChartEdgeProductChromeKeys | 'licenseKey'>;
export type ChartEdgeApexProps = Omit<ChartEdgeHostProps, ChartEdgeProductChromeKeys>;

/** Minimal embed: candlestick/line plot and axes only (no toolbars). */
export const ChartEdgePulse = forwardRef<ChartEdgeHostHandle, ChartEdgePulseProps>((props, ref) => (
    <ChartEdgeHost ref={ref} productId="pulse" {...props} />
));

/** Analysis layout: symbol bar and chart controls; no drawing tools sidebar. */
export const ChartEdgeFlow = forwardRef<ChartEdgeHostHandle, ChartEdgeFlowProps>((props, ref) => (
    <ChartEdgeHost ref={ref} productId="flow" {...props} />
));

/** Full interactive chart: drawings, settings, live data API (default product line). */
export const ChartEdgeCommand = forwardRef<ChartEdgeHostHandle, ChartEdgeCommandProps>((props, ref) => (
    <ChartEdgeHost ref={ref} productId="command" {...props} />
));

/** Broker / embedded terminal: same capabilities as Command; attribution is always shown. */
export const ChartEdgeDesk = forwardRef<ChartEdgeHostHandle, ChartEdgeDeskProps>((props, ref) => (
    <ChartEdgeHost ref={ref} productId="desk" {...props} />
));

/**
 * Reserved for premium ChartEdge Apex features. Same UI as Command today; pass `licenseKey` when licensed.
 * Without a key, an evaluation banner is shown.
 */
export const ChartEdgeApex = forwardRef<ChartEdgeHostHandle, ChartEdgeApexProps>((props, ref) => (
    <ChartEdgeHost ref={ref} productId="apex" {...props} />
));

ChartEdgePulse.displayName = 'ChartEdgePulse';
ChartEdgeFlow.displayName = 'ChartEdgeFlow';
ChartEdgeCommand.displayName = 'ChartEdgeCommand';
ChartEdgeDesk.displayName = 'ChartEdgeDesk';
ChartEdgeApex.displayName = 'ChartEdgeApex';
