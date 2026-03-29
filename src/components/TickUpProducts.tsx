import React, {forwardRef} from 'react';
import {
    TickUpHost,
    type TickUpHostHandle,
    type TickUpHostProps,
} from './TickUpHost';

/** Props disallowed on tier components: chrome is fixed per product (not overridable at init). */
type TickUpProductChromeKeys = 'productId' | 'showSidebar' | 'showTopBar' | 'showSettingsBar';

export type TickUpPulseProps = Omit<TickUpHostProps, TickUpProductChromeKeys | 'licenseKey'>;
export type TickUpFlowProps = Omit<TickUpHostProps, TickUpProductChromeKeys | 'licenseKey'>;
export type TickUpCommandProps = Omit<TickUpHostProps, TickUpProductChromeKeys | 'licenseKey'>;
export type TickUpDeskProps = Omit<TickUpHostProps, TickUpProductChromeKeys | 'licenseKey'>;
export type TickUpPrimeTierProps = Omit<TickUpHostProps, TickUpProductChromeKeys>;

/** Minimal embed: candlestick/line plot and axes only (no toolbars). */
export const TickUpPulse = forwardRef<TickUpHostHandle, TickUpPulseProps>((props, ref) => (
    <TickUpHost ref={ref} productId="pulse" {...props} />
));

/** Analysis layout: symbol bar and chart controls; no drawing tools sidebar. */
export const TickUpFlow = forwardRef<TickUpHostHandle, TickUpFlowProps>((props, ref) => (
    <TickUpHost ref={ref} productId="flow" {...props} />
));

/** Full interactive chart: drawings, settings, live data API (default product line). */
export const TickUpCommand = forwardRef<TickUpHostHandle, TickUpCommandProps>((props, ref) => (
    <TickUpHost ref={ref} productId="command" {...props} />
));

/** Broker / embedded terminal: same capabilities as Command; attribution is always shown. */
export const TickUpDesk = forwardRef<TickUpHostHandle, TickUpDeskProps>((props, ref) => (
    <TickUpHost ref={ref} productId="desk" {...props} />
));

/**
 * Licensed / evaluation tier: same shell as Command. Without `licenseKey`, an eval strip is shown.
 * For **render engine** (neon canvas profile), use {@link TickUpPrime} with `setEngine` or `chartOptions.base.engine`.
 */
export const TickUpPrimeTier = forwardRef<TickUpHostHandle, TickUpPrimeTierProps>((props, ref) => (
    <TickUpHost ref={ref} productId="prime" {...props} />
));

TickUpPulse.displayName = 'TickUpPulse';
TickUpFlow.displayName = 'TickUpFlow';
TickUpCommand.displayName = 'TickUpCommand';
TickUpDesk.displayName = 'TickUpDesk';
TickUpPrimeTier.displayName = 'TickUpPrimeTier';
