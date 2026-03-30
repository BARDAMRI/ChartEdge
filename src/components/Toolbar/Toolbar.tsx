import React from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {ModeButton} from './Buttons';
import {
    ToolbarContainer,
    ToolbarContent
} from '../../styles/Toolbar.styles';
import {Tooltip} from '../Tooltip';
import {Placement, TooltipAlign, TooltipAxis} from '../../types/buttons';
import {IconLine, IconRect, IconCircle, IconTriangle, IconAngle, IconSelect, IconPencil} from './icons';

import { translate, getLocaleDefaults } from '../../utils/i18n';

interface ToolbarProps {
    language?: string;
    locale?: string;
    primeGlass?: boolean;
    /** Light frosted Prime chrome when the plot uses `base.theme: ChartTheme.light`. */
    primeGlassLight?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
    language = 'en', 
    locale = 'en-US',
    primeGlass = false,
    primeGlassLight = false,
}) => {
    const {mode, setMode} = useMode();

    const direction = getLocaleDefaults(locale).direction;

    return (
        <ToolbarContainer $primeGlass={primeGlass} $primeGlassLight={primeGlassLight}>
            <ToolbarContent>
                <Tooltip content={translate('draw_line', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.drawLine}
                        currentMode={mode}
                        onClickHandler={setMode}
                    >
                        <IconLine active={mode === Mode.drawLine}/>
                    </ModeButton>
                </Tooltip>

                <Tooltip content={translate('draw_rect', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.right}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.drawRectangle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconRect active={mode === Mode.drawRectangle}/></ModeButton>
                </Tooltip>

                <Tooltip content={translate('draw_circle', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.drawCircle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconCircle active={mode === Mode.drawCircle}/></ModeButton>
                </Tooltip>

                <Tooltip content={translate('draw_triangle', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.drawTriangle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconTriangle active={mode === Mode.drawTriangle}/></ModeButton>
                </Tooltip>

                <Tooltip content={translate('draw_angle', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.drawAngle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconAngle active={mode === Mode.drawAngle}/></ModeButton>
                </Tooltip>

                <Tooltip content={translate('select', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.select}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconSelect active={mode === Mode.select}/></ModeButton>
                </Tooltip>

                <Tooltip content={translate('edit_shape', language)} tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center} dir={direction}>
                    <ModeButton
                        mode={Mode.editShape}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconPencil active={mode === Mode.editShape}/></ModeButton>
                </Tooltip>
            </ToolbarContent>
        </ToolbarContainer>
    );
};