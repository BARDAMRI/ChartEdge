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
    ModalTextInput,
    NumberInput,
    ColorInput,
    SectionTitle,
    SelectDropdown,
    SubMenuPane,
    SwitchToggle,
    BackArrowIcon,
    SettingsModalIconRole,
    type ModalThemeVariant,
} from './SettingsModal.styles';
import { IconClose, IconSave } from '../Toolbar/icons';
import { AxesPosition, ChartTheme } from '../../types/types';
import { getLocaleDefaults, SUPPORTED_LANGUAGES, SUPPORTED_LOCALES, SUPPORTED_CURRENCIES } from '../../utils/i18n';
import {
    AxesUnitPlacement,
    CurrencyDisplay,
    NumberNotation,
} from '../../types/chartOptions';
import { StrokeLineStyle } from '../../types/overlay';

/* ──────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────── */
export enum SettingsCategoryId {
    chart = 'chart',
    axes = 'axes',
    time = 'time',
    layout = 'layout',
    colors = 'colors',
    drawings = 'drawings',
    globalization = 'globalization',
    financial = 'financial',
}

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
    unitPlacement: AxesUnitPlacement;
    drawingLineColor: string;
    drawingLineWidth: number;
    drawingLineStyle: StrokeLineStyle;
    drawingFillColor: string;
    drawingSelectedLineColor: string;
    drawingSelectedLineStyle: StrokeLineStyle;
    drawingSelectedLineWidthAdd: number;
    showCandleTooltip: boolean;
    showCrosshair: boolean;
    showCrosshairValues: boolean;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newSettings: SettingsState) => void;
    initialSettings: SettingsState;
    /** Matches chart app light/dark toggle */
    themeVariant?: ModalThemeVariant;
    /** When true, the Layout category (toolbar toggles) is hidden; toolbar chrome is product-controlled. */
    lockToolbarLayout?: boolean;
    /**
     * When true, the overlay is `position: absolute` within the nearest positioned ancestor
     * (e.g. the chart host wrapper) instead of covering the full viewport.
     */
    contained?: boolean;
}

/* ─── BackArrow logic is now handled via CSS in SettingsModal.styles.ts ─── */

/* ──────────────────────────────────────────────────
 *  Category metadata
 * ────────────────────────────────────────────────── */
const CATEGORIES: { id: SettingsCategoryId; icon: string; label: string }[] = [
    { id: SettingsCategoryId.chart, icon: '📊', label: 'Chart Style' },
    { id: SettingsCategoryId.axes, icon: '📐', label: 'Axes' },
    { id: SettingsCategoryId.time, icon: '⏱', label: 'Time' },
    { id: SettingsCategoryId.layout, icon: '🖥', label: 'Layout' },
    { id: SettingsCategoryId.colors, icon: '🎨', label: 'Colors' },
    { id: SettingsCategoryId.drawings, icon: '✏️', label: 'Drawing shapes' },
    { id: SettingsCategoryId.globalization, icon: '🌐', label: 'Regional' },
    { id: SettingsCategoryId.financial, icon: '💰', label: 'Financials' },
];

const CATEGORY_TITLE: Record<SettingsCategoryId, string> = {
    [SettingsCategoryId.chart]: 'Chart Style',
    [SettingsCategoryId.axes]: 'Axes',
    [SettingsCategoryId.time]: 'Time',
    [SettingsCategoryId.layout]: 'Layout',
    [SettingsCategoryId.colors]: 'Colors',
    [SettingsCategoryId.drawings]: 'Drawing shapes',
    [SettingsCategoryId.globalization]: 'Regional & Format',
    [SettingsCategoryId.financial]: 'Currency & Price',
};


/* ──────────────────────────────────────────────────
 *  Component
 * ────────────────────────────────────────────────── */
export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, onSave, initialSettings, themeVariant = ChartTheme.dark, lockToolbarLayout = false,
    contained = false,
}) => {
    const tv = themeVariant;
    const [settings, setSettings] = useState<SettingsState>(initialSettings);
    const [active, setActive] = useState<SettingsCategoryId | null>(null);
    const [goingBack, setGoingBack] = useState(false);

    const initialSettingsRef = useRef(initialSettings);
    initialSettingsRef.current = initialSettings;

    useEffect(() => {
        if (isOpen) {
            setSettings(initialSettingsRef.current);
            setActive(null);
        }
    }, [isOpen]);

    const visibleCategories = lockToolbarLayout
        ? CATEGORIES.filter((c) => c.id !== SettingsCategoryId.layout)
        : CATEGORIES;

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

    const drillIn = (cat: SettingsCategoryId) => {
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
            case SettingsCategoryId.chart:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Display</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show Volume Histogram</FormLabel>
                            <SwitchToggle $checked={settings.showHistogram}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showHistogram')} />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show Background Grid</FormLabel>
                            <SwitchToggle $checked={settings.showGrid}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showGrid')} />
                        </FormRow>
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Hover</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show candle tooltip</FormLabel>
                            <SwitchToggle $checked={settings.showCandleTooltip}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showCandleTooltip')} />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show crosshair lines</FormLabel>
                            <SwitchToggle
                                $checked={settings.showCrosshair}
                                className="settings-switch-toggle"
                                onClick={() =>
                                    setSettings((prev) => {
                                        const next = !prev.showCrosshair;
                                        return {
                                            ...prev,
                                            showCrosshair: next,
                                            showCrosshairValues: next ? prev.showCrosshairValues : false,
                                        };
                                    })
                                }
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show time &amp; price on crosshair</FormLabel>
                            <SwitchToggle
                                $checked={settings.showCrosshairValues}
                                $disabled={!settings.showCrosshair}
                                className="settings-switch-toggle"
                                onClick={() =>
                                    setSettings((prev) => {
                                        if (!prev.showCrosshair) {
                                            return prev;
                                        }
                                        return {
                                            ...prev,
                                            showCrosshairValues: !prev.showCrosshairValues,
                                        };
                                    })
                                }
                            />
                        </FormRow>
                    </SubMenuPane>
                );
            case SettingsCategoryId.axes:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Y-Axis</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Y-Axis Position</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                className="settings-select-dropdown"
                                value={settings.yAxisPosition}
                                onChange={(e: any) => change('yAxisPosition', parseInt(e.target.value))}
                            >
                                <option value={AxesPosition.right}>Right</option>
                                <option value={AxesPosition.left}>Left</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Number of Y-Ticks</FormLabel>
                            <NumberInput
                                $variant={tv}
                                className="settings-number-input"
                                type="number" min="2" max="30"
                                value={settings.numberOfYTicks}
                                onChange={(e: any) => change('numberOfYTicks', parseInt(e.target.value) || 2)}
                            />
                        </FormRow>
                    </SubMenuPane>
                );
            case SettingsCategoryId.time:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Format</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>12-Hour Time Format</FormLabel>
                            <SwitchToggle $checked={settings.timeFormat12h}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('timeFormat12h')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case SettingsCategoryId.layout:
                if (lockToolbarLayout) {
                    return (
                        <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                            <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Toolbars</SectionTitle>
                            <p style={{margin: '8px 0 0', fontSize: 13, opacity: 0.85}} dir={direction}>
                                Toolbar layout is fixed for this TickUp product and cannot be changed here.
                            </p>
                        </SubMenuPane>
                    );
                }
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Toolbars</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show Side Toolbar</FormLabel>
                            <SwitchToggle $checked={settings.showSidebar}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showSidebar')} />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Show Top Toolbar</FormLabel>
                            <SwitchToggle $checked={settings.showTopBar}
                                          className="settings-switch-toggle"
                                          onClick={() => toggle('showTopBar')} />
                        </FormRow>
                    </SubMenuPane>
                );
            case SettingsCategoryId.colors:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Theme Colors</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Background Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.backgroundColor}
                                onChange={(e: any) => change('backgroundColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Text & Axis Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.textColor}
                                onChange={(e: any) => change('textColor', e.target.value)}
                            />
                        </FormRow>
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Chart Elements</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Bull (Up) Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.bullColor}
                                onChange={(e: any) => change('bullColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Bear (Down) Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.bearColor}
                                onChange={(e: any) => change('bearColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Line Color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.lineColor}
                                onChange={(e: any) => change('lineColor', e.target.value)}
                            />
                        </FormRow>
                    </SubMenuPane>
                );
            case SettingsCategoryId.drawings:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>New shapes</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Stroke color</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.drawingLineColor}
                                onChange={(e: any) => change('drawingLineColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Line width</FormLabel>
                            <NumberInput
                                $variant={tv}
                                className="settings-number-input"
                                type="number"
                                min={1}
                                max={16}
                                value={settings.drawingLineWidth}
                                onChange={(e: any) => change('drawingLineWidth', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Line style</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                className="settings-select-dropdown"
                                value={settings.drawingLineStyle}
                                onChange={(e: any) => change('drawingLineStyle', e.target.value as StrokeLineStyle)}
                            >
                                <option value={StrokeLineStyle.solid}>Solid</option>
                                <option value={StrokeLineStyle.dashed}>Dashed</option>
                                <option value={StrokeLineStyle.dotted}>Dotted</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Fill color</FormLabel>
                            <ModalTextInput
                                $variant={tv}
                                className="settings-input"
                                type="text"
                                value={settings.drawingFillColor}
                                onChange={(e: any) => change('drawingFillColor', e.target.value)}
                                placeholder="rgba(33,150,243,0.2) or #hex"
                                dir="ltr"
                            />
                        </FormRow>
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Selected shape</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Highlight stroke</FormLabel>
                            <ColorInput
                                type="color"
                                value={settings.drawingSelectedLineColor}
                                onChange={(e: any) => change('drawingSelectedLineColor', e.target.value)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Extra width when selected</FormLabel>
                            <NumberInput
                                $variant={tv}
                                className="settings-number-input"
                                type="number"
                                min={0}
                                max={8}
                                value={settings.drawingSelectedLineWidthAdd}
                                onChange={(e: any) =>
                                    change('drawingSelectedLineWidthAdd', Math.max(0, parseInt(e.target.value, 10) || 0))
                                }
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Highlight line style</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                className="settings-select-dropdown"
                                value={settings.drawingSelectedLineStyle}
                                onChange={(e: any) =>
                                    change('drawingSelectedLineStyle', e.target.value as StrokeLineStyle)}
                            >
                                <option value={StrokeLineStyle.solid}>Solid</option>
                                <option value={StrokeLineStyle.dashed}>Dashed</option>
                                <option value={StrokeLineStyle.dotted}>Dotted</option>
                            </SelectDropdown>
                        </FormRow>
                    </SubMenuPane>
                );
            case SettingsCategoryId.globalization:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Language & Locale</SectionTitle>
                         <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Language</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                className="settings-select-dropdown"
                                value={settings.language}
                                onChange={(e: any) => handleLanguageChange(e.target.value)}
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                                ))}
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Locale (l10n)</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                className="settings-select-dropdown"
                                value={settings.locale}
                                onChange={(e: any) => handleLocaleChange(e.target.value)}
                            >
                                {Object.keys(SUPPORTED_LOCALES).map(loc => (
                                    <option key={loc} value={loc}>{SUPPORTED_LOCALES[loc].label}</option>
                                ))}
                            </SelectDropdown>
                        </FormRow>

                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Date Format</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Date Pattern</FormLabel>
                            <SelectDropdown
                                $variant={tv}
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
            case SettingsCategoryId.financial:
                return (
                    <SubMenuPane $back={goingBack} className="settings-submenu-pane">
                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Currency</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Enable Currency</FormLabel>
                            <SwitchToggle $checked={settings.useCurrency}
                                          onClick={() => toggle('useCurrency')} />
                        </FormRow>
                        {settings.useCurrency && (
                            <>
                                <FormRow $variant={tv} className="settings-form-row">
                                    <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Select Currency</FormLabel>
                                    <SelectDropdown
                                        $variant={tv}
                                        value={settings.currency}
                                        onChange={(e: any) => change('currency', e.target.value)}
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </SelectDropdown>
                                </FormRow>
                                <FormRow $variant={tv} className="settings-form-row">
                                    <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Symbol Placement</FormLabel>
                                    <SelectDropdown
                                        $variant={tv}
                                        value={settings.currencyDisplay}
                                        onChange={(e: any) =>
                                            change('currencyDisplay', e.target.value as CurrencyDisplay)}
                                    >
                                        <option value={CurrencyDisplay.symbol}>Symbol ($)</option>
                                        <option value={CurrencyDisplay.narrowSymbol}>Narrow ($)</option>
                                        <option value={CurrencyDisplay.code}>Code (USD)</option>
                                        <option value={CurrencyDisplay.name}>Name (dollars)</option>
                                    </SelectDropdown>
                                </FormRow>
                            </>
                        )}

                        <SectionTitle $variant={tv} className="settings-section-title" dir={direction}>Number & Price</SectionTitle>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Notation</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                value={settings.numberNotation}
                                onChange={(e: any) => change('numberNotation', e.target.value as NumberNotation)}
                            >
                                <option value={NumberNotation.standard}>Standard</option>
                                <option value={NumberNotation.scientific}>Scientific</option>
                                <option value={NumberNotation.compact}>Compact</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Auto Precision</FormLabel>
                            <SwitchToggle
                                $checked={settings.autoPrecision}
                                onClick={() => change('autoPrecision', !settings.autoPrecision)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row" style={{ opacity: settings.autoPrecision ? 0.5 : 1 }}>
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Decimal Places</FormLabel>
                            <NumberInput
                                $variant={tv}
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
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Custom Unit</FormLabel>
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
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Unit Placement</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                value={settings.unitPlacement}
                                onChange={(e: any) => change('unitPlacement', e.target.value as AxesUnitPlacement)}
                            >
                                <option value={AxesUnitPlacement.suffix}>Suffix (100 BTC)</option>
                                <option value={AxesUnitPlacement.prefix}>Prefix (BTC 100)</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Significant Digits</FormLabel>
                            <NumberInput
                                $variant={tv}
                                type="number" min="1" max="21"
                                value={settings.maximumSignificantDigits}
                                onChange={(e: any) => change('maximumSignificantDigits', parseInt(e.target.value) || 21)}
                            />
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Decimal Mark</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                value={settings.decimalSeparator}
                                onChange={(e: any) => change('decimalSeparator', e.target.value)}
                            >
                                <option value=".">Dot ( . )</option>
                                <option value=",">Comma ( , )</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Digit Grouping</FormLabel>
                            <SelectDropdown
                                $variant={tv}
                                value={settings.thousandsSeparator}
                                onChange={(e: any) => change('thousandsSeparator', e.target.value)}
                            >
                                <option value=",">Comma ( , )</option>
                                <option value=".">Dot ( . )</option>
                                <option value=" ">Space (   )</option>
                                <option value="">None</option>
                            </SelectDropdown>
                        </FormRow>
                        <FormRow $variant={tv} className="settings-form-row">
                            <FormLabel $variant={tv} className="settings-form-label" dir={direction}>Tick Size</FormLabel>
                            <NumberInput
                                $variant={tv}
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
        <ModalOverlay $variant={tv} $contained={contained} onClick={onClose} className="settings-modal-overlay">
            <ModalContainer
                $variant={tv}
                onClick={(e: any) => e.stopPropagation()}
                className="settings-modal-container"
            >

                {/* ── Header ── */}
                <ModalHeader $variant={tv} className="settings-header">
                    <HeaderLeft className="settings-header-left">
                        {active && (
                            <IconButton
                                $theme={tv}
                                $variant={SettingsModalIconRole.back}
                                className="settings-back-button"
                                onClick={goBack}
                                aria-label="Back"
                            >
                                <BackArrowIcon />
                            </IconButton>
                        )}
                        <h2 className="settings-header-title" dir={direction}>{headerTitle}</h2>
                    </HeaderLeft>
                    <IconButton
                        $theme={tv}
                        $variant={SettingsModalIconRole.close}
                        className="settings-close-button"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <IconClose />
                    </IconButton>
                </ModalHeader>

                {/* ── Body ── */}
                <ModalBody className="settings-modal-body">
                    {active === null ? (
                        /* Root: category tiles */
                        <div className="settings-category-list">
                            {visibleCategories.map(cat => (
                                <CategoryTile $variant={tv} key={cat.id} className={`settings-category-tile settings-category-${cat.id}`} onClick={() => drillIn(cat.id)}>
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
                <ModalFooter $variant={tv} className="settings-modal-footer">
                    <ModalButton $variant={tv} className="settings-cancel-button" onClick={onClose} dir={direction}>Cancel</ModalButton>
                    <ModalButton $variant={tv} $primary className="settings-save-button" onClick={handleSave} dir={direction}>
                        <IconSave />
                        Save Changes
                    </ModalButton>
                </ModalFooter>

            </ModalContainer>
        </ModalOverlay>
    );
};
