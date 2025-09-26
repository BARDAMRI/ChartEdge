import React, {useState} from "react";
import {
    ChartTypeDropdown,
    ChartTypeOption,
    ChartTypeSelectContainer, ChartTypeTrigger
} from "../../styles/ChartTypeSelectDropdown.styles";
import {ChartType} from "../../types/chartOptions";
import {IconChartLine, IconChartBar, IconChartCandle, IconChartArea, IconArrowDown} from './icons';

const icons: Record<ChartType, React.ReactNode> = {
    Line: <IconChartLine/>,
    Bar: <IconChartBar/>,
    Candlestick: <IconChartCandle/>,
    Area: <IconChartArea/>
};

interface Props {
    value: ChartType;
    onChange: (type: ChartType) => void;
}

export const ChartTypeSelectDropdown: React.FC<Props> = ({value, onChange}) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (type: ChartType) => {
        onChange(type);
        setOpen(false);
    };

    return (
        <ChartTypeSelectContainer className={"chart-type-select-dropdown"}>
            <ChartTypeTrigger onClick={() => setOpen(!open)}>
                {icons[value]}
                <IconArrowDown />
            </ChartTypeTrigger>
            {open && (
                <ChartTypeDropdown>
                    {(Object.keys(icons) as ChartType[]).map((type) => (
                        <ChartTypeOption
                            key={type}
                            onClick={() => handleSelect(type)}
                            $active={value === type}
                        >
                            {icons[type]}
                        </ChartTypeOption>
                    ))}
                </ChartTypeDropdown>
            )}
        </ChartTypeSelectContainer>
    );
};