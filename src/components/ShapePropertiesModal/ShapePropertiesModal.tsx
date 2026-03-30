import React, {useEffect, useState} from 'react';
import { ChartTheme } from '../../types/types';
import {
    FormLabel,
    FormRow,
    HeaderLeft,
    IconButton,
    ModalBody,
    ModalButton,
    ModalContainer,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    ModalTextInput,
    NumberInput,
    ColorInput,
    SectionTitle,
    SelectDropdown,
    type ModalThemeVariant,
} from '../SettingsModal/SettingsModal.styles';
import {IconClose, IconSave} from '../Toolbar/icons';
import {IDrawingShape} from '../Drawing/IDrawingShape';
import {CustomSymbolShape} from '../Drawing/CustomSymbolShape';
import {
    applyShapePropertiesForm,
    shapeToFormState,
    type ShapePropertiesFormState,
} from './applyShapeProperties';

export interface ShapePropertiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Drawing under edit; modal reads initial fields when opened */
    shape: IDrawingShape | null;
    onApply: (shape: IDrawingShape, form: ShapePropertiesFormState) => void;
    themeVariant?: ModalThemeVariant;
}

export const ShapePropertiesModal: React.FC<ShapePropertiesModalProps> = ({
    isOpen,
    onClose,
    shape,
    onApply,
    themeVariant = ChartTheme.dark,
}) => {
    const tv = themeVariant;
    const [form, setForm] = useState<ShapePropertiesFormState | null>(null);

    useEffect(() => {
        if (isOpen && shape) {
            setForm(shapeToFormState(shape));
        }
    }, [isOpen, shape]);

    if (!isOpen || !shape || !form) {
        return null;
    }

    const title = `Shape properties — ${shape.type}`;
    const isSymbol = shape instanceof CustomSymbolShape;

    const patch = <K extends keyof ShapePropertiesFormState>(key: K, value: ShapePropertiesFormState[K]) =>
        setForm((prev) => (prev ? {...prev, [key]: value} : prev));

    const handleApply = () => {
        onApply(shape, form);
        onClose();
    };

    const node = (
        <ModalOverlay $variant={tv} $contained onClick={onClose} className="shape-props-modal-overlay">
            <ModalContainer
                $variant={tv}
                onClick={(e) => e.stopPropagation()}
                className="shape-props-modal-container"
            >
                <ModalHeader $variant={tv} className="shape-props-header">
                    <HeaderLeft>
                        <h2>{title}</h2>
                    </HeaderLeft>
                    <IconButton $theme={tv} $variant="close" onClick={onClose} aria-label="Close">
                        <IconClose />
                    </IconButton>
                </ModalHeader>

                <ModalBody className="shape-props-body">
                    <SectionTitle $variant={tv}>Stroke &amp; fill</SectionTitle>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Stroke color</FormLabel>
                        <ColorInput type="color" value={form.lineColor} onChange={(e) => patch('lineColor', e.target.value)} />
                    </FormRow>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Line width</FormLabel>
                        <NumberInput
                            $variant={tv}
                            type="number"
                            min={1}
                            max={16}
                            value={form.lineWidth}
                            onChange={(e) => patch('lineWidth', Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                    </FormRow>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Line style</FormLabel>
                        <SelectDropdown
                            $variant={tv}
                            value={form.lineStyle}
                            onChange={(e) => patch('lineStyle', e.target.value as ShapePropertiesFormState['lineStyle'])}
                        >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </SelectDropdown>
                    </FormRow>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Fill color</FormLabel>
                        <ModalTextInput
                            $variant={tv}
                            type="text"
                            value={form.fillColor}
                            onChange={(e) => patch('fillColor', e.target.value)}
                            placeholder="rgba(0,0,0,0) or #hex"
                            dir="ltr"
                        />
                    </FormRow>

                    <SectionTitle $variant={tv}>When selected</SectionTitle>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Highlight stroke</FormLabel>
                        <ColorInput
                            type="color"
                            value={form.selectedLineColor}
                            onChange={(e) => patch('selectedLineColor', e.target.value)}
                        />
                    </FormRow>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Extra width</FormLabel>
                        <NumberInput
                            $variant={tv}
                            type="number"
                            min={0}
                            max={8}
                            value={form.selectedLineWidthAdd}
                            onChange={(e) =>
                                patch('selectedLineWidthAdd', Math.max(0, parseInt(e.target.value, 10) || 0))
                            }
                        />
                    </FormRow>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Highlight line style</FormLabel>
                        <SelectDropdown
                            $variant={tv}
                            value={form.selectedLineStyle}
                            onChange={(e) =>
                                patch('selectedLineStyle', e.target.value as ShapePropertiesFormState['selectedLineStyle'])
                            }
                        >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </SelectDropdown>
                    </FormRow>
                    <FormRow $variant={tv}>
                        <FormLabel $variant={tv}>Highlight fill (optional)</FormLabel>
                        <ModalTextInput
                            $variant={tv}
                            type="text"
                            value={form.selectedFillColor}
                            onChange={(e) => patch('selectedFillColor', e.target.value)}
                            placeholder="Leave empty to use stroke only"
                            dir="ltr"
                        />
                    </FormRow>

                    {isSymbol && (
                        <>
                            <SectionTitle $variant={tv}>Symbol</SectionTitle>
                            <FormRow $variant={tv}>
                                <FormLabel $variant={tv}>Text</FormLabel>
                                <ModalTextInput
                                    $variant={tv}
                                    type="text"
                                    value={form.symbolText}
                                    onChange={(e) => patch('symbolText', e.target.value)}
                                    maxLength={8}
                                    dir="ltr"
                                />
                            </FormRow>
                            <FormRow $variant={tv}>
                                <FormLabel $variant={tv}>Font size</FormLabel>
                                <NumberInput
                                    $variant={tv}
                                    type="number"
                                    min={8}
                                    max={120}
                                    value={form.symbolSize}
                                    onChange={(e) =>
                                        patch('symbolSize', Math.max(8, Math.min(120, parseInt(e.target.value, 10) || 20)))
                                    }
                                />
                            </FormRow>
                        </>
                    )}
                </ModalBody>

                <ModalFooter $variant={tv}>
                    <ModalButton $variant={tv} type="button" onClick={onClose}>
                        Cancel
                    </ModalButton>
                    <ModalButton $variant={tv} $primary type="button" onClick={handleApply}>
                        <IconSave />
                        Apply
                    </ModalButton>
                </ModalFooter>
            </ModalContainer>
        </ModalOverlay>
    );

    return node;
};
