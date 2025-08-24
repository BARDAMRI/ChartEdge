import React, {useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {ModeButton} from './Buttons';
import {
    ToolbarContainer,
    ToolbarContent
} from '../../styles/Toolbar.styles';
import {Tooltip} from '../Tooltip';
import {Placement, TooltipAlign, TooltipAxis} from '../../types/buttons';
import {IconLine, IconRect, IconCircle, IconTriangle, IconAngle, IconSelect, IconPencil} from './icons';

export const Toolbar: React.FC = () => {
    const {mode, setMode} = useMode();

    useEffect(() => {
        console.log('Toolbar mode changed:', mode);
    }, [mode]);

    return (
        <ToolbarContainer className="toolbar-container">
            <ToolbarContent>
                <Tooltip content="Draw Line" placement={Placement.auto} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawLine}
                        currentMode={mode}
                        onClickHandler={setMode}
                    >
                        <IconLine active={mode === Mode.drawLine}/>
                    </ModeButton>
                </Tooltip>

                <Tooltip content="Draw Rectangle" placement={Placement.right} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawRectangle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconRect active={mode === Mode.drawRectangle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Draw Circle" placement={Placement.auto} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawCircle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconCircle active={mode === Mode.drawCircle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Draw Triangle" placement={Placement.auto} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawTriangle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconTriangle active={mode === Mode.drawTriangle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Draw Angle" placement={Placement.auto} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawAngle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconAngle active={mode === Mode.drawAngle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Select" placement={Placement.auto} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.select}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconSelect active={mode === Mode.select}/></ModeButton>
                </Tooltip>

                <Tooltip content="Edit Shape" placement={Placement.auto} axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
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