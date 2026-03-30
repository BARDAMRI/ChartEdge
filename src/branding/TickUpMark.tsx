import React from 'react';
import {ChartTheme} from '../types/types';
import {
    TICKUP_WORDMARK_URL_DARK,
    TICKUP_WORDMARK_URL_GREY,
    TICKUP_WORDMARK_URL_LIGHT,
} from './tickupBrandAssets';

/** @deprecated Use {@link ChartTheme} */
export type TickUpThemeVariant = ChartTheme;

type TickUpMarkProps = {
    variant: ChartTheme;
    /** Total height in px */
    height?: number;
    className?: string;
    'aria-hidden'?: boolean;
};

/**
 * Optional DOM wordmark (e.g. marketing). Theme-aware full logos.
 */
export function TickUpMark({
    variant,
    height = 20,
    className,
    'aria-hidden': ariaHidden = true,
}: TickUpMarkProps) {
    const src =
        variant === ChartTheme.dark
            ? TICKUP_WORDMARK_URL_DARK
            : variant === ChartTheme.grey
              ? TICKUP_WORDMARK_URL_GREY
              : TICKUP_WORDMARK_URL_LIGHT;

    return (
        <img
            className={className}
            src={src}
            height={height}
            alt={ariaHidden ? '' : 'TickUp'}
            aria-hidden={ariaHidden}
            draggable={false}
            style={{display: 'block', height, width: 'auto', maxWidth: 'min(100%, 320px)', objectFit: 'contain'}}
        />
    );
}
