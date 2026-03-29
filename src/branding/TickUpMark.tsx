import React from 'react';
import {
    TICKUP_WORDMARK_URL_DARK,
    TICKUP_WORDMARK_URL_GREY,
    TICKUP_WORDMARK_URL_LIGHT,
} from './tickupBrandAssets';

export type TickUpThemeVariant = 'light' | 'dark' | 'grey';

type TickUpMarkProps = {
    variant: TickUpThemeVariant;
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
        variant === 'dark'
            ? TICKUP_WORDMARK_URL_DARK
            : variant === 'grey'
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
