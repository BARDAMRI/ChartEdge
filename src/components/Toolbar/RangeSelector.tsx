import React from 'react';
import { RangeSelectorContainer, RangeButton, RangeLabel } from '../../styles/RangeSelector.styles';

export type RangeKey = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All';

const RANGES: RangeKey[] = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

export interface RangeSelectorProps {
    onRangeChange: (range: RangeKey) => void;
    currentRange?: RangeKey;
    isDark?: boolean;
    showLabel? : boolean;
}

export const RangeSelector: React.FC<RangeSelectorProps> = ({
    onRangeChange,
    currentRange,
    isDark = false,
    showLabel = true
}) => {
    return (
        <RangeSelectorContainer $isDark={isDark} className="range-selector">
            {showLabel && <RangeLabel $isDark={isDark}>Range</RangeLabel>}
            {RANGES.map((r) => (
                <RangeButton
                    key={r}
                    $active={currentRange === r}
                    $isDark={isDark}
                    onClick={() => onRangeChange(r)}
                    className={`range-btn-${r}`}
                >
                    {r}
                </RangeButton>
            ))}
        </RangeSelectorContainer>
    );
};
