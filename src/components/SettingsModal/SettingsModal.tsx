import React, { useState, useEffect, useRef } from 'react';
import {
    CategoryTile,
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
    NumberInput,
    ColorInput,
    SectionTitle,
    SelectDropdown,
    SubMenuPane,
    SwitchToggle,
    BackArrowIcon,
} from './SettingsModal.styles';
import { IconClose, IconSave } from '../Toolbar/icons';
import { AxesPosition } from '../../types/types';

/* ──────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────── */
export interface SettingsState {
    showSidebar: boolean;
    showTopBar: boolean;
    showHistogram: boolean;
    showGrid: boolean;
    timeFormat12h: boolean;
    yAxisPosition: AxesPosition;
    numberOfYTicks: number;
    backgroundColor: string;
    textColor: string;
    bullColor: string;
    bearColor: string;
    lineColor: string;
}

type Category = 'chart' | 'axes' | 'time' | 'layout' | 'colors';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newSettings: SettingsState) => void;
    initialSettings: SettingsState;
}

/* ─── BackArrow logic is now handled via CSS in SettingsModal.styles.ts ─── */

/* ──────────────────────────────────────────────────
 *  Category metadata
 * ────────────────────────────────────────────────── */
const CATEGORIES: { id: Category; icon: string; label: string }[] = [
    { id: 'chart',  icon: '📊', label: 'Chart Style'  },
    { id: 'axes',   icon: '📐', label: 'Axes'         },
    { id: 'time',   icon: '⏱',  label: 'Time'         },
    { id: 'layout', icon: '🖥',  label: 'Layout'       },
    { id: 'colors', icon: '🎨', label: 'Colors'       },
];

const CATEGORY_TITLE: Record<Category, string> = {
    chart:  'Chart Style',
    axes:   'Axes',
    time:   'Time',
    layout: 'Layout',
    colors: 'Colors',
};


/* ──────────────────────────────────────────────────
 *  Component
 * ────────────────────────────────────────────────── */
export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, onSave, initialSettings,
}) => {
    const [settings, setSettings] = useState<SettingsState>(initialSettings);
    const [active, setActive] = useState<Category | null>(null);
    const [goingBack, setGoingBack] = useState(false);

    const initialSettingsRef = useRef(initialSettings);
    initialSettingsRef.current = initialSettings;

    useEffect(() => {
        if (isOpen) {
            setSettings(initialSettingsRef.current);
            setActive(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const toggle = (key: keyof SettingsState) =>
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));

    const change = (key: keyof SettingsState, value: any) =>
        setSettings(prev => ({ ...prev, [key]: value }));

    const handleSave = () => { onSave(settings); onClose(); };

    const drillIn = (cat: Category) => {
        setGoingBack(false);
        setActive(cat);
    };

    const goBack = () => {
        setGoingBack(true);
        setActive(null);
    };

    /* ── header title / back button ── */
    const headerTitle = active ? CATEGORY_TITLE[active] : 'Chart Settings';

    /* ── sub-menu content ── */
    const renderSubMenu = () => {
        switch (active) {
            case 'chart':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title">Display</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Show Volume Histogram</FormLabel>
                            <SwitchToggle $checked={settings.showHistogram}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showHistogram')} />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Show Background Grid</FormLabel>
                            <SwitchToggle $checked={settings.showGrid}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showGrid')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'axes':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title">Y-Axis</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Y-Axis Position</FormLabel>
                            <SelectDropdown
                                className="settings-select-dropdown"
                                value={settings.yAxisPosition}
                                onChange={(e: any) => change('yAxisPosition', parseInt(e.target.value))}
                            >
                                <option value={AxesPosition.right}>Right</option>
                                <option value={AxesPosition.left}>Left</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Number of Y-Ticks</FormLabel>
                            <NumberInput
                                className="settings-number-input"
                                type="number" min="2" max="30"
                                value={settings.numberOfYTicks}
                                onChange={(e: any) => change('numberOfYTicks', parseInt(e.target.value) || 2)}
                            />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'time':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title">Format</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">12-Hour Time Format</FormLabel>
                            <SwitchToggle $checked={settings.timeFormat12h}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('timeFormat12h')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'layout':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title">Toolbars</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Show Side Toolbar</FormLabel>
                            <SwitchToggle $checked={settings.showSidebar}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showSidebar')} />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Show Top Toolbar</FormLabel>
                            <SwitchToggle $checked={settings.showTopBar}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showTopBar')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'colors':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title">Theme Colors</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Background Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.backgroundColor}
                                onChange={(e: any) => change('backgroundColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Text & Axis Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.textColor}
                                onChange={(e: any) => change('textColor', e.target.value)}
                            />
                        </FormRow>
                        <SectionTitle className="settings-section-title">Chart Elements</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Bull (Up) Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.bullColor}
                                onChange={(e: any) => change('bullColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Bear (Down) Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.bearColor}
                                onChange={(e: any) => change('bearColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label">Line Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.lineColor}
                                onChange={(e: any) => change('lineColor', e.target.value)}
                            />
                        </FormRow>
                    </SubMenuPane>
                );
            default:
                return null;
        }
    };

    return (
        <ModalOverlay onClick={onClose} className="settings-modal-overlay">
            <ModalContainer onClick={(e: any) => e.stopPropagation()} className="settings-modal-container">

                {/* ── Header ── */}
                <ModalHeader className="settings-header">
                    <HeaderLeft className="settings-header-left">
                        {active && (
                            <IconButton $variant="back" className="settings-back-button" onClick={goBack} aria-label="Back">
                                <BackArrowIcon />
                            </IconButton>
                        )}
                        <h2 className="settings-header-title">{headerTitle}</h2>
                    </HeaderLeft>
                    <IconButton $variant="close" className="settings-close-button" onClick={onClose} aria-label="Close settings">
                        <IconClose />
                    </IconButton>
                </ModalHeader>

                {/* ── Body ── */}
                <ModalBody className="settings-modal-body">
                    {active === null ? (
                        /* Root: category tiles */
                        <div className="settings-category-list">
                            {CATEGORIES.map(cat => (
                                <CategoryTile key={cat.id} className={`settings-category-tile settings-category-${cat.id}`} onClick={() => drillIn(cat.id)}>
                                    <span className="tile-icon">{cat.icon}</span>
                                    <span className="tile-label">{cat.label}</span>
                                    <span className="tile-arrow">›</span>
                                </CategoryTile>
                            ))}
                        </div>
                    ) : (
                        renderSubMenu()
                    )}
                </ModalBody>

                {/* ── Footer ── */}
                <ModalFooter className="settings-modal-footer">
                    <ModalButton className="settings-cancel-button" onClick={onClose}>Cancel</ModalButton>
                    <ModalButton $primary className="settings-save-button" onClick={handleSave}>
                        <IconSave />
                        Save Changes
                    </ModalButton>
                </ModalFooter>

            </ModalContainer>
        </ModalOverlay>
    );
};
