import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    IntervalSelectContainer,
    IntervalDropdown,
    IntervalOption,
    IntervalOptionsGrid,
    IntervalSection,
    IntervalSectionLabel
} from '../../styles/IntervalSelect.styles';
import {IconArrowDown} from './icons';
import {ChartTheme} from '../../types/types';
import {Button} from './Buttons';

export type IntervalCategory = 'Minutes' | 'Hours' | 'Days' | 'Weeks' | 'Months';

export const INTERVAL_LIST: { category: IntervalCategory, options: string[] }[] = [
    { category: 'Minutes', options: ['1m', '2m', '3m', '5m', '10m', '15m', '30m', '45m'] },
    { category: 'Hours', options: ['1h', '2h', '3h', '4h'] },
    { category: 'Days', options: ['1D'] },
    { category: 'Weeks', options: ['1W'] },
    { category: 'Months', options: ['1M'] },
];

interface Props {
    value: string;
    onChange: (interval: string) => void;
    themeVariant?: ChartTheme;
    className?: string;
}

export const IntervalSelect: React.FC<Props> = ({value, onChange, themeVariant = ChartTheme.dark, className}) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [menuBox, setMenuBox] = useState({top: 0, left: 0, width: 320, maxHeight: 320});
    const [cols, setCols] = useState<1 | 2 | 3 | 4>(4);
    const isDark = themeVariant === ChartTheme.dark;

    const updateMenuPosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();

        const margin = 8;
        const chartContainer =
            el.closest('.chart-view') as HTMLElement | null ||
            el.closest('.canvas-axis-container') as HTMLElement | null ||
            el.closest('.tickup-root') as HTMLElement | null;
        const containerRect = chartContainer?.getBoundingClientRect();
        const bounds = {
            left: Math.max(margin, containerRect?.left ?? margin),
            right: Math.min(window.innerWidth - margin, containerRect?.right ?? window.innerWidth - margin),
            top: Math.max(margin, containerRect?.top ?? margin),
            bottom: Math.min(window.innerHeight - margin, containerRect?.bottom ?? window.innerHeight - margin),
        };

        const desiredWidth = 360;
        const maxAllowedWidth = Math.max(220, Math.min(440, bounds.right - bounds.left));
        const width = Math.max(220, Math.min(desiredWidth, maxAllowedWidth));

        let left = Math.max(bounds.left, Math.min(r.left, bounds.right - width));
        let top = r.bottom + 6;
        const maxHeightBelow = Math.max(140, bounds.bottom - top);
        let maxHeight = Math.min(480, maxHeightBelow);

        // If there is not enough room below, open above trigger.
        if (maxHeightBelow < 180) {
            top = Math.max(bounds.top, r.top - Math.min(480, bounds.bottom - bounds.top));
            maxHeight = Math.min(480, Math.max(140, r.top - bounds.top - 6));
        }

        setMenuBox({top, left, width, maxHeight});

        // Refine position after render and recalc columns based on exact width.
        requestAnimationFrame(() => {
            const menu = menuRef.current;
            if (!menu) return;
            const mr = menu.getBoundingClientRect();
            const finalLeft = Math.max(bounds.left, Math.min(left, bounds.right - mr.width));
            const finalTop = Math.max(bounds.top, Math.min(top, bounds.bottom - Math.min(mr.height, maxHeight)));
            setMenuBox((prev) => ({...prev, left: finalLeft, top: finalTop}));

            // 92px label + 12px gap + 20px dropdown horizontal paddings
            const optionsAreaWidth = Math.max(0, mr.width - 92 - 12 - 20);
            const cellWidth = 54;
            const nextCols = Math.max(1, Math.min(4, Math.floor(optionsAreaWidth / cellWidth))) as 1 | 2 | 3 | 4;
            setCols(nextCols);
        });
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        updateMenuPosition();
    }, [open, updateMenuPosition]);

    useEffect(() => {
        if (!open) return;
        const onReposition = () => updateMenuPosition();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, updateMenuPosition]);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: PointerEvent) => {
            const t = e.target as Node;
            if (triggerRef.current?.contains(t)) return;
            if (menuRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => document.removeEventListener('pointerdown', onPointerDown, true);
    }, [open]);

    const handleSelect = (tf: string) => {
        onChange(tf);
        setOpen(false);
    };

    return (
        <IntervalSelectContainer className={className || 'interval-select-dropdown'}>
            <Button
                className="interval-select-trigger"
                onClickHandler={() => setOpen((v) => !v)}
            >
                <div 
                    ref={triggerRef}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '11px', 
                        fontWeight: 700,
                        color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.9)',
                        padding: '0 2px'
                    }}
                >
                    <span>{value}</span>
                    <div style={{ width: '10px', height: '10px', opacity: 0.6 }}>
                        <IconArrowDown active={open}/>
                    </div>
                </div>
            </Button>
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <IntervalDropdown
                        ref={menuRef}
                        role="listbox"
                        $top={menuBox.top}
                        $left={menuBox.left}
                        $width={menuBox.width}
                        $maxHeight={menuBox.maxHeight}
                        $isDark={isDark}
                    >
                        {INTERVAL_LIST.map((section) => (
                            <IntervalSection key={section.category} $isDark={isDark}>
                                <IntervalSectionLabel $isDark={isDark}>{section.category}</IntervalSectionLabel>
                                <IntervalOptionsGrid $cols={cols}>
                                    {section.options.map((opt) => (
                                        <IntervalOption
                                            key={opt}
                                            type="button"
                                            role="option"
                                            aria-selected={value === opt}
                                            onClick={() => handleSelect(opt)}
                                            $active={value === opt}
                                            $isDark={isDark}
                                        >
                                            {opt}
                                        </IntervalOption>
                                    ))}
                                </IntervalOptionsGrid>
                            </IntervalSection>
                        ))}
                    </IntervalDropdown>,
                    document.body
                )}
        </IntervalSelectContainer>
    );
};
