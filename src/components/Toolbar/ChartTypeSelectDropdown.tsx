import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    ChartTypeDropdown,
    ChartTypeOption,
    ChartTypeSelectContainer,
    ChartTypeTrigger,
} from '../../styles/ChartTypeSelectDropdown.styles';
import {ChartType} from '../../types/chartOptions';
import {IconChartLine, IconChartBar, IconChartCandle, IconChartArea, IconArrowDown} from './icons';

const icons: Record<ChartType, React.ReactNode> = {
    Line: <IconChartLine />,
    Bar: <IconChartBar />,
    Candlestick: <IconChartCandle />,
    Area: <IconChartArea />,
};

interface Props {
    value: ChartType;
    onChange: (type: ChartType) => void;
    className?: string;
}

export const ChartTypeSelectDropdown: React.FC<Props> = ({value, onChange, className}) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [menuBox, setMenuBox] = useState({top: 0, left: 0, minWidth: 120});

    const updateMenuPosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setMenuBox({
            top: r.bottom + 4,
            left: r.left,
            minWidth: Math.max(r.width, 120),
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

    const handleSelect = (type: ChartType) => {
        onChange(type);
        setOpen(false);
    };

    return (
        <ChartTypeSelectContainer className={className || 'chart-type-select-dropdown'}>
            <ChartTypeTrigger
                ref={triggerRef}
                role="button"
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpen((v) => !v);
                    }
                    if (e.key === 'Escape') setOpen(false);
                }}
            >
                {icons[value]}
                <IconArrowDown />
            </ChartTypeTrigger>
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <ChartTypeDropdown
                        ref={menuRef}
                        role="listbox"
                        $top={menuBox.top}
                        $left={menuBox.left}
                        $minWidth={menuBox.minWidth}
                    >
                        {(Object.keys(icons) as ChartType[]).map((type) => (
                            <ChartTypeOption
                                key={type}
                                type="button"
                                role="option"
                                aria-selected={value === type}
                                onClick={() => handleSelect(type)}
                                $active={value === type}
                            >
                                {icons[type]}
                            </ChartTypeOption>
                        ))}
                    </ChartTypeDropdown>,
                    document.body
                )}
        </ChartTypeSelectContainer>
    );
};
