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
import { getLocaleDefaults, SUPPORTED_LANGUAGES, SUPPORTED_LOCALES, SUPPORTED_CURRENCIES } from '../../utils/i18n';
import { CurrencyDisplay, NumberNotation } from '../../types/chartOptions';

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
    fractionDigits: number;
    decimalSeparator: string;
    thousandsSeparator: string;
    dateFormat: string;
    locale: string;
    language: string;
    currency: string;
    useCurrency: boolean;
    currencyDisplay: CurrencyDisplay;
    numberNotation: NumberNotation;
    minimumFractionDigits: number;
    maximumFractionDigits: number;
    maximumSignificantDigits: number;
    tickSize: number;
    autoPrecision: boolean;
    unit: string;
    unitPlacement: 'prefix' | 'suffix';
}

type Category = 'chart' | 'axes' | 'time' | 'layout' | 'colors' | 'globalization' | 'financial';

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
    { id: 'chart',         icon: '📊', label: 'Chart Style'   },
    { id: 'axes',          icon: '📐', label: 'Axes'          },
    { id: 'time',          icon: '⏱',  label: 'Time'          },
    { id: 'layout',        icon: '🖥',  label: 'Layout'        },
    { id: 'colors',        icon: '🎨', label: 'Colors'        },
    { id: 'globalization', icon: '🌐', label: 'Regional'      },
    { id: 'financial',     icon: '💰', label: 'Financials'    },
];

const CATEGORY_TITLE: Record<Category, string> = {
    chart:          'Chart Style',
    axes:           'Axes',
    time:           'Time',
    layout:         'Layout',
    colors:         'Colors',
    globalization:  'Regional & Format',
    financial:      'Currency & Price',
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
    }, [isOpen]);

    const handleLanguageChange = (newLang: string) => {
        let newLocale = settings.locale;
        const matchingLocale = Object.keys(SUPPORTED_LOCALES).find(loc => SUPPORTED_LOCALES[loc].language === newLang);
        if (matchingLocale && !settings.locale.startsWith(newLang)) {
            newLocale = matchingLocale;
        }

        const defaults = getLocaleDefaults(newLocale);
        setSettings(prev => ({
            ...prev,
            language: newLang,
            locale: newLocale,
            decimalSeparator: defaults.decimalSeparator,
            thousandsSeparator: defaults.thousandsSeparator,
            dateFormat: defaults.dateFormat,
            currency: defaults.defaultCurrency || prev.currency,
        }));
    };

    const handleLocaleChange = (newLocale: string) => {
        const defaults = getLocaleDefaults(newLocale);
        setSettings(prev => ({
            ...prev,
            locale: newLocale,
            language: defaults.language,
            decimalSeparator: defaults.decimalSeparator,
            thousandsSeparator: defaults.thousandsSeparator,
            dateFormat: defaults.dateFormat,
            currency: defaults.defaultCurrency || prev.currency,
        }));
    };

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
    const direction = getLocaleDefaults(settings.locale).direction;

    /* ── sub-menu content ── */
    const renderSubMenu = () => {
        switch (active) {
            case 'chart':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title" dir={direction}>Display</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Show Volume Histogram</FormLabel>
                            <SwitchToggle $checked={settings.showHistogram}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showHistogram')} />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Show Background Grid</FormLabel>
                            <SwitchToggle $checked={settings.showGrid}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showGrid')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'axes':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title" dir={direction}>Y-Axis</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Y-Axis Position</FormLabel>
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
                            <FormLabel className="settings-form-label" dir={direction}>Number of Y-Ticks</FormLabel>
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
                        <SectionTitle className="settings-section-title" dir={direction}>Format</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>12-Hour Time Format</FormLabel>
                            <SwitchToggle $checked={settings.timeFormat12h}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('timeFormat12h')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'layout':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title" dir={direction}>Toolbars</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Show Side Toolbar</FormLabel>
                            <SwitchToggle $checked={settings.showSidebar}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showSidebar')} />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Show Top Toolbar</FormLabel>
                            <SwitchToggle $checked={settings.showTopBar}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showTopBar')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'colors':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title" dir={direction}>Theme Colors</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Background Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.backgroundColor}
                                onChange={(e: any) => change('backgroundColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Text & Axis Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.textColor}
                                onChange={(e: any) => change('textColor', e.target.value)}
                            />
                        </FormRow>
                        <SectionTitle className="settings-section-title" dir={direction}>Chart Elements</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Bull (Up) Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.bullColor}
                                onChange={(e: any) => change('bullColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Bear (Down) Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.bearColor}
                                onChange={(e: any) => change('bearColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Line Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.lineColor}
                                onChange={(e: any) => change('lineColor', e.target.value)}
                            />
                        </FormRow>
                    </SubMenuPane>
                );
            case 'globalization':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title" dir={direction}>Language & Locale</SectionTitle>
                         <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Language</FormLabel>
                            <SelectDropdown
                                className="settings-select-dropdown"
                                value={settings.language}
                                onChange={(e: any) => handleLanguageChange(e.target.value)}
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                                ))}
                            </SelectDropdown>
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Locale (l10n)</FormLabel>
                            <SelectDropdown
                                className="settings-select-dropdown"
                                value={settings.locale}
                                onChange={(e: any) => handleLocaleChange(e.target.value)}
                            >
                                {Object.keys(SUPPORTED_LOCALES).map(loc => (
                                    <option key={loc} value={loc}>{SUPPORTED_LOCALES[loc].label}</option>
                                ))}
                            </SelectDropdown>
                        </FormRow>

                        <SectionTitle className="settings-section-title" dir={direction}>Date Format</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Date Pattern</FormLabel>
                            <SelectDropdown
                                className="settings-select-dropdown"
                                value={settings.dateFormat}
                                onChange={(e: any) => change('dateFormat', e.target.value)}
                            >
                                <option value="MMM d, yyyy">Mar 23, 2025</option>
                                <option value="dd/MM/yyyy">23/03/2025</option>
                                <option value="MM/dd/yyyy">03/23/2025</option>
                                <option value="yyyy-MM-dd">2025-03-23</option>
                                <option value="yyyy/MM/dd">2025/03/23</option>
                                <option value="d MMM yyyy">23 Mar 2025</option>
                                <option value="d.M.yyyy">23.3.2025</option>
                                <option value="yyyy. MM. dd.">2025. 03. 23.</option>
                            </SelectDropdown>
                        </FormRow>
                    </SubMenuPane>
                );
            case 'financial':
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle className="settings-section-title" dir={direction}>Currency</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Enable Currency</FormLabel>
                            <SwitchToggle $checked={settings.useCurrency}
                                          onClick={() => toggle('useCurrency')} />
                        </FormRow>
                        {settings.useCurrency && (
                            <>
                                <FormRow className="settings-form-row">
                                    <FormLabel className="settings-form-label" dir={direction}>Select Currency</FormLabel>
                                    <SelectDropdown
                                        value={settings.currency}
                                        onChange={(e: any) => change('currency', e.target.value)}
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </SelectDropdown>
                                </FormRow>
                                <FormRow className="settings-form-row">
                                    <FormLabel className="settings-form-label" dir={direction}>Symbol Placement</FormLabel>
                                    <SelectDropdown
                                        value={settings.currencyDisplay}
                                        onChange={(e: any) => change('currencyDisplay', e.target.value)}
                                    >
                                        <option value="symbol">Symbol ($)</option>
                                        <option value="narrowSymbol">Narrow ($)</option>
                                        <option value="code">Code (USD)</option>
                                        <option value="name">Name (dollars)</option>
                                    </SelectDropdown>
                                </FormRow>
                            </>
                        )}

                        <SectionTitle className="settings-section-title" dir={direction}>Number & Price</SectionTitle>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Notation</FormLabel>
                            <SelectDropdown
                                value={settings.numberNotation}
                                onChange={(e: any) => change('numberNotation', e.target.value)}
                            >
                                <option value="standard">Standard</option>
                                <option value="scientific">Scientific</option>
                                <option value="compact">Compact</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Auto Precision</FormLabel>
                            <SwitchToggle
                                $checked={settings.autoPrecision}
                                onClick={() => change('autoPrecision', !settings.autoPrecision)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row" style={{ opacity: settings.autoPrecision ? 0.5 : 1 }}>
                            <FormLabel className="settings-form-label" dir={direction}>Decimal Places</FormLabel>
                            <NumberInput
                                type="number" min="0" max="15"
                                value={settings.fractionDigits}
                                onChange={(e: any) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setSettings(prev => ({
                                        ...prev,
                                        fractionDigits: val,
                                        minimumFractionDigits: val,
                                        maximumFractionDigits: val
                                    }));
                                }}
                                disabled={settings.autoPrecision}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Custom Unit</FormLabel>
                            <input
                                className="settings-input"
                                type="text"
                                value={settings.unit}
                                onChange={(e: any) => change('unit', e.target.value)}
                                placeholder="e.g. %, BTC, pts"
                                style={{
                                    flex: 1,
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    color: '#333'
                                }}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Unit Placement</FormLabel>
                            <SelectDropdown
                                value={settings.unitPlacement}
                                onChange={(e: any) => change('unitPlacement', e.target.value)}
                            >
                                <option value="suffix">Suffix (100 BTC)</option>
                                <option value="prefix">Prefix (BTC 100)</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Significant Digits</FormLabel>
                            <NumberInput
                                type="number" min="1" max="21"
                                value={settings.maximumSignificantDigits}
                                onChange={(e: any) => change('maximumSignificantDigits', parseInt(e.target.value) || 21)}
                            />
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Decimal Mark</FormLabel>
                            <SelectDropdown
                                value={settings.decimalSeparator}
                                onChange={(e: any) => change('decimalSeparator', e.target.value)}
                            >
                                <option value=".">Dot ( . )</option>
                                <option value=",">Comma ( , )</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Digit Grouping</FormLabel>
                            <SelectDropdown
                                value={settings.thousandsSeparator}
                                onChange={(e: any) => change('thousandsSeparator', e.target.value)}
                            >
                                <option value=",">Comma ( , )</option>
                                <option value=".">Dot ( . )</option>
                                <option value=" ">Space (   )</option>
                                <option value="">None</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow className="settings-form-row">
                            <FormLabel className="settings-form-label" dir={direction}>Tick Size</FormLabel>
                            <NumberInput
                                type="number" step="0.0001" min="0"
                                value={settings.tickSize}
                                onChange={(e: any) => change('tickSize', parseFloat(e.target.value) || 0)}
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
            <ModalContainer 
                onClick={(e: any) => e.stopPropagation()} 
                className="settings-modal-container"
            >

                {/* ── Header ── */}
                <ModalHeader className="settings-header">
                    <HeaderLeft className="settings-header-left">
                        {active && (
                            <IconButton $variant="back" className="settings-back-button" onClick={goBack} aria-label="Back">
                                <BackArrowIcon />
                            </IconButton>
                        )}
                        <h2 className="settings-header-title" dir={direction}>{headerTitle}</h2>
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
                                    <span className="tile-label" dir={direction}>{cat.label}</span>
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
                    <ModalButton className="settings-cancel-button" onClick={onClose} dir={direction}>Cancel</ModalButton>
                    <ModalButton $primary className="settings-save-button" onClick={handleSave} dir={direction}>
                        <IconSave />
                        Save Changes
                    </ModalButton>
                </ModalFooter>

            </ModalContainer>
        </ModalOverlay>
    );
};
