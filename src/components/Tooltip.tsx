const LIGHT_TOKENS = {
    bg: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.96) 100%)',
    border: 'rgba(123, 97, 255, 0.35)',
    text: '#1e2a44',
    shadow: '0 8px 24px rgba(17,19,39,0.18), inset 0 1px 0 rgba(255,255,255,0.45)'
};
const DARK_TOKENS = {
    bg: 'linear-gradient(180deg, rgba(22,24,36,0.92) 0%, rgba(16,18,30,0.94) 100%)',
    border: 'rgba(160, 170, 255, 0.40)',
    text: 'rgba(235,240,255,0.92)',
    shadow: '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)'
};
const pickTokens = () => {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const hasDarkClass = typeof document !== 'undefined' && document.body && document.body.classList.contains('dark');
    return (prefersDark || hasDarkClass) ? DARK_TOKENS : LIGHT_TOKENS;
};
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Placement, TooltipAlign, TooltipAxis} from '../types/buttons';
import {TooltipArrow, TooltipBox, TooltipWrapper} from "../styles/Tooltip.styles";

type TooltipProps = {
    content: React.ReactNode;
    placement?: Placement;
    axis?: TooltipAxis;
    align?: TooltipAlign;
    offset?: number;
    autoFlip?: boolean;
    delayHideMs?: number;
    children: React.ReactElement<any>;
};

export const Tooltip: React.FC<TooltipProps> = ({
                                                    content,
                                                    placement = Placement.auto,
                                                    axis = TooltipAxis.horizontal,
                                                    align = TooltipAlign.center,
                                                    offset = 10,
                                                    autoFlip = true,
                                                    delayHideMs = 120,
                                                    children,
                                                }) => {
    const [open, setOpen] = useState(false);
    const timer = useRef<number | undefined>(undefined);
    const containerRef = useRef<HTMLSpanElement | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const tipRef = useRef<HTMLSpanElement | null>(null);
    const [tipSize, setTipSize] = useState<{ w: number; h: number }>({w: 0, h: 0});
    const [effectivePlacement, setEffectivePlacement] = useState<Placement>(Placement.top);
    const arrowSize = 8; // px

    const measure = () => {
        const el = containerRef.current;
        if (!el) return;
        setAnchorRect(el.getBoundingClientRect());
    };

    const show = () => {
        if (timer.current != undefined) {
            window.clearTimeout(timer.current!);
        }
        measure();
        setOpen(true);
    };

    const hide = () => {
        if (timer.current != undefined) {
            window.clearTimeout(timer.current!);
        }
        timer.current = window.setTimeout(() => setOpen(false), delayHideMs);
    };

    useEffect(
        () => () => {
            if (timer.current != undefined) {
                window.clearTimeout(timer.current!);
            }
        },
        []
    );

    useEffect(() => {
        if (!open) return;
        const onWinChange = () => measure();
        window.addEventListener('scroll', onWinChange, {passive: true});
        window.addEventListener('resize', onWinChange);
        measure();
        return () => {
            window.removeEventListener('scroll', onWinChange);
            window.removeEventListener('resize', onWinChange);
        };
    }, [open]);

    const measureTip = () => {
        const el = tipRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setTipSize({w: rect.width, h: rect.height});
    };

    const resolvePlacement = (
        pref: Placement,
        ax: TooltipAxis,
        rect: DOMRect,
        size: { w: number; h: number }
    ) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const spaceTop = rect.top;
        const spaceBottom = vh - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = vw - rect.right;
        let side: Placement;

        if (pref === Placement.auto) {
            if (ax === TooltipAxis.horizontal) {
                side = spaceRight >= spaceLeft ? Placement.right : Placement.left;
            } else if (ax === TooltipAxis.vertical) {
                side = spaceBottom >= spaceTop ? Placement.bottom : Placement.top;
            } else {
                const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
                side =
                    maxSpace === spaceBottom
                        ? Placement.bottom
                        : maxSpace === spaceTop
                            ? Placement.top
                            : maxSpace === spaceRight
                                ? Placement.right
                                : Placement.left;
            }
        } else {
            side = pref;
        }

        const wouldOverflow = () => {
            switch (side) {
                case Placement.top:
                    return size.h + offset > spaceTop;
                case Placement.bottom:
                    return size.h + offset > spaceBottom;
                case Placement.left:
                    return size.w + offset > spaceLeft;
                case Placement.right:
                    return size.w + offset > spaceRight;
            }
        };

        if (autoFlip && wouldOverflow()) {
            side =
                side === Placement.top
                    ? Placement.bottom
                    : side === Placement.bottom
                        ? Placement.top
                        : side === Placement.left
                            ? Placement.right
                            : Placement.left;
        }
        return side;
    };

    useLayoutEffect(() => {
        if (!open || !anchorRect) return;
        measureTip();
        queueMicrotask(() => {
            if (!anchorRect) return;
            const side = resolvePlacement(placement, axis, anchorRect, tipSize);
            setEffectivePlacement(side);
        });
    }, [open, anchorRect, placement, axis, tipSize.w, tipSize.h]);

    const posStyle: React.CSSProperties = (() => {
        const rect = anchorRect;
        const base: React.CSSProperties = {position: 'fixed'};
        if (!rect) return base;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = 0,
            top = 0,
            transform = '';
        const pad = 6;

        if (effectivePlacement === Placement.bottom || effectivePlacement === Placement.top) {
            let centerX = rect.left + rect.width / 2;
            if (align === TooltipAlign.start) centerX = rect.left + tipSize.w / 2;
            if (align === TooltipAlign.end) centerX = rect.right - tipSize.w / 2;
            const halfW = tipSize.w / 2;
            centerX = Math.max(pad + halfW, Math.min(vw - pad - halfW, centerX));

            left = centerX;
            top =
                effectivePlacement === Placement.bottom ? rect.bottom + offset : rect.top - offset;
            transform = `translate(-50%, ${
                effectivePlacement === Placement.bottom ? '0' : '-100%'
            })`;
        } else {
            let centerY = rect.top + rect.height / 2;
            if (align === TooltipAlign.start) centerY = rect.top + tipSize.h / 2;
            if (align === TooltipAlign.end) centerY = rect.bottom - tipSize.h / 2;
            const halfH = tipSize.h / 2;
            centerY = Math.max(pad + halfH, Math.min(vh - pad - halfH, centerY));

            top = centerY;
            left =
                effectivePlacement === Placement.right ? rect.right + offset : rect.left - offset;
            transform = `translate(${
                effectivePlacement === Placement.right ? '0' : '-100%'
            }, -50%)`;
        }

        return {...base, left, top, transform};
    })();

    return (
        <TooltipWrapper
            ref={containerRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {open &&
                createPortal(
                    (() => {
                        const t = pickTokens();
                        return (
                            <TooltipBox
                                ref={tipRef}
                                id="ce-tooltip"
                                role="tooltip"
                                left={(posStyle as any).left as number}
                                top={(posStyle as any).top as number}
                                // --- START OF FIX ---
                                $transformCss={(posStyle as any).transform as string}
                                $bg={t.bg}
                                $border={t.border}
                                $text={t.text}
                                $shadow={t.shadow}
                                // --- END OF FIX ---
                            >
                                <TooltipArrow
                                    $placement={effectivePlacement}
                                    $size={arrowSize}
                                    $bg={t.bg}
                                    $border={t.border}
                                    $shadow={t.shadow}
                                    aria-hidden
                                />
                                {content}
                            </TooltipBox>
                        );
                    })(),
                    document.body
                )}
        </TooltipWrapper>
    );
};