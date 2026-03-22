import React, { useState, useEffect } from 'react';
import {
    IconButton,
    ModalBody,
    ModalButton,
    ModalContainer,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    FormRow,
    FormLabel,
    SwitchToggle,
    NumberInput,
    SelectDropdown
} from './SettingsModal.styles';
import { IconClose, IconSave } from '../Toolbar/icons';
import { AxesPosition } from '../../types/types';

export interface SettingsState {
    showSidebar: boolean;
    showTopBar: boolean;
    showHistogram: boolean;
    showGrid: boolean;
    timeFormat12h: boolean;
    yAxisPosition: AxesPosition;
    numberOfYTicks: number;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newSettings: SettingsState) => void;
    initialSettings: SettingsState;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState<SettingsState>(initialSettings);

    useEffect(() => {
        if (isOpen) {
            setSettings(initialSettings);
        }
    }, [isOpen, initialSettings]);

    if (!isOpen) return null;

    const handleToggle = (key: keyof SettingsState) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key: keyof SettingsState, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    return (
        <ModalOverlay onClick={onClose} className="settings-modal-overlay">
            <ModalContainer onClick={(e) => e.stopPropagation()} className="settings-modal-container">
                <ModalHeader>
                    <h2>Chart Settings</h2>
                    <IconButton onClick={onClose} aria-label="Close settings">
                        <IconClose />
                    </IconButton>
                </ModalHeader>
                
                <ModalBody>
                    <FormRow>
                        <FormLabel>Show Side Toolbar</FormLabel>
                        <SwitchToggle $checked={settings.showSidebar} onClick={() => handleToggle('showSidebar')} />
                    </FormRow>

                    <FormRow>
                        <FormLabel>Show Top Toolbar</FormLabel>
                        <SwitchToggle $checked={settings.showTopBar} onClick={() => handleToggle('showTopBar')} />
                    </FormRow>

                    <FormRow>
                        <FormLabel>Show Volume Histogram</FormLabel>
                        <SwitchToggle $checked={settings.showHistogram} onClick={() => handleToggle('showHistogram')} />
                    </FormRow>

                    <FormRow>
                        <FormLabel>Show Background Grid</FormLabel>
                        <SwitchToggle $checked={settings.showGrid} onClick={() => handleToggle('showGrid')} />
                    </FormRow>

                    <FormRow>
                        <FormLabel>12-Hour Time Format</FormLabel>
                        <SwitchToggle $checked={settings.timeFormat12h} onClick={() => handleToggle('timeFormat12h')} />
                    </FormRow>

                    <FormRow>
                        <FormLabel>Y-Axis Position</FormLabel>
                        <SelectDropdown 
                            value={settings.yAxisPosition} 
                            onChange={(e) => handleChange('yAxisPosition', parseInt(e.target.value))}
                        >
                            <option value={AxesPosition.right}>Right Side</option>
                            <option value={AxesPosition.left}>Left Side</option>
                        </SelectDropdown>
                    </FormRow>

                    <FormRow>
                        <FormLabel>Number of Y-Ticks</FormLabel>
                        <NumberInput 
                            type="number" 
                            min="2"
                            max="30"
                            value={settings.numberOfYTicks} 
                            onChange={(e) => handleChange('numberOfYTicks', parseInt(e.target.value) || 2)}
                        />
                    </FormRow>
                </ModalBody>

                <ModalFooter>
                    <ModalButton onClick={onClose}>Cancel</ModalButton>
                    <ModalButton $primary onClick={handleSave}>
                        <IconSave />
                        Save Changes
                    </ModalButton>
                </ModalFooter>
            </ModalContainer>
        </ModalOverlay>
    );
};
