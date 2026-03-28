import { NumberNotation, CurrencyDisplay } from '../../../types/chartOptions';

export interface FormatNumberOptions {
    fractionDigits?: number;
    decimalSeparator?: string;
    thousandsSeparator?: string;
    locale?: string;
    style?: 'decimal' | 'currency' | 'percent';
    currency?: string;
    currencyDisplay?: CurrencyDisplay;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    maximumSignificantDigits?: number;
    notation?: NumberNotation;
    tickSize?: number;
    unit?: string;
    unitPlacement?: 'prefix' | 'suffix';
    conversionRate?: number;
    displayCurrency?: string;
    metricType?: 'basisPoints' | 'pnl' | 'yield' | 'volatility';
    showSign?: boolean;
}

/**
 * Powerful number formatter using Intl.NumberFormat with custom separator support.
 */
export function formatNumber(
    value: number,
    options: FormatNumberOptions = {}
): string {
    if (value === undefined || value === null || !isFinite(value)) {
        return '';
    }
    const {
        locale = 'en-US',
        style = 'decimal',
        currency,
        currencyDisplay = 'symbol',
        minimumFractionDigits,
        maximumFractionDigits,
        maximumSignificantDigits,
        notation = 'standard',
        decimalSeparator,
        thousandsSeparator,
        fractionDigits,
        tickSize,
        unit,
        unitPlacement = 'suffix'
    } = options;

    let valToFormat = value;
    let customUnit = unit;

    if (options.metricType === 'basisPoints') {
        valToFormat = value * 10000;
        customUnit = 'bps';
    } else if (options.metricType === 'yield' || options.metricType === 'volatility') {
        customUnit = '%';
    }

    if (options.conversionRate && options.conversionRate !== 1 && options.metricType !== 'basisPoints') {
        valToFormat = valToFormat * options.conversionRate;
    }

    if (tickSize && tickSize > 0) {
        valToFormat = Math.round(valToFormat / tickSize) * (tickSize);
    }

    // Use fractionDigits if precision options aren't provided (backward compatibility)
    let maxFrac = maximumFractionDigits ?? (fractionDigits !== undefined ? fractionDigits : 2);
    let minFrac = minimumFractionDigits ?? (fractionDigits !== undefined ? fractionDigits : undefined);

    // Sanitize fraction digits to avoid RangeError
    maxFrac = Math.max(0, Math.min(20, maxFrac));
    if (minFrac !== undefined) {
        minFrac = Math.max(0, Math.min(maxFrac, minFrac));
    }

    const intlOptions: Intl.NumberFormatOptions = {
        style: (currency ? 'currency' : (customUnit === '%' ? 'percent' : style)) as 'decimal' | 'currency' | 'percent',
        currency,
        currencyDisplay: currency ? (currencyDisplay as 'symbol' | 'narrowSymbol' | 'code' | 'name') : undefined,
        notation: notation as 'standard' | 'scientific' | 'compact',
        signDisplay: (options.showSign || options.metricType === 'pnl') ? 'always' : 'auto',
    };

    if (maximumSignificantDigits !== undefined && maximumSignificantDigits < 21) {
        intlOptions.maximumSignificantDigits = maximumSignificantDigits;
    } else {
        intlOptions.minimumFractionDigits = minFrac;
        intlOptions.maximumFractionDigits = maxFrac;
    }

    // Filter undefined
    Object.keys(intlOptions).forEach(key => 
        (intlOptions as any)[key] === undefined && delete (intlOptions as any)[key]
    );

    const formatter = new Intl.NumberFormat(locale, intlOptions);

    let result: string;
    if (!decimalSeparator && !thousandsSeparator) {
        result = formatter.format(valToFormat / (customUnit === '%' && value > 1 ? 100 : 1));
    } else {
        const parts = formatter.formatToParts(valToFormat / (customUnit === '%' && value > 1 ? 100 : 1));
        result = parts.map(part => {
            if (part.type === 'decimal' && decimalSeparator !== undefined) return decimalSeparator;
            if (part.type === 'group' && thousandsSeparator !== undefined) return thousandsSeparator;
            return part.value;
        }).join('');
    }

    if (customUnit && customUnit !== '%') {
        if (unitPlacement === 'prefix') {
            result = `${customUnit}${result}`;
        } else {
            result = `${result}${customUnit}`;
        }
    }

    return result;
}

/**
 * Handle localized numeric input.
 * Example: '1.200,50' in de-DE -> 1200.5
 */
export function parseNumber(
    input: string,
    locale: string = 'en-US',
    decimalSeparator?: string
): number | null {
    if (!input) return null;

    let cleanInput = input.trim();
    
    // If a custom decimal separator is provided, we should use it.
    // Otherwise, we can try to infer it from the locale.
    const effectiveDecimalSeparator = decimalSeparator || (new Intl.NumberFormat(locale).formatToParts(1.1).find(p => p.type === 'decimal')?.value || '.');
    const effectiveThousandsSeparator = new Intl.NumberFormat(locale).formatToParts(1000).find(p => p.type === 'group')?.value || ',';

    // Remove thousands separators
    const thousandsRegex = new RegExp(`\\${effectiveThousandsSeparator}`, 'g');
    cleanInput = cleanInput.replace(thousandsRegex, '');

    // Replace decimal separator with standard point
    const decimalRegex = new RegExp(`\\${effectiveDecimalSeparator}`, 'g');
    cleanInput = cleanInput.replace(decimalRegex, '.');

    const parsed = parseFloat(cleanInput);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Normalize a value for the clipboard, stripping all formatting for programmatic use.
 */
export function normalizeClipboardValue(value: string | number): string {
    if (typeof value === 'number') return value.toString();
    // Strip everything except numbers, decimal point, and minus sign
    return value.replace(/[^\d.-]/g, '');
}
