import { AxesStyleOptions } from '../types/chartOptions';
import { formatNumber, parseNumber, normalizeClipboardValue, FormatNumberOptions } from '../components/Canvas/utils/formatters';
import { compareStrings } from '../utils/i18n';
import { resolveLocaleSettings } from '../utils/LocaleResolver';
import { format as dateFnsFormat } from 'date-fns';
import { getDateFnsLocale } from '../utils/i18n';
import { formatWithTimezone } from '../utils/timeUtils';

/**
 * Centralized service for all formatting and localization needs.
 * This decouples the presentation layer from the data layer.
 */
export class FormattingService {
    /**
     * Format a price or numeric value for display on axes or tooltips.
     */
    /**
     * Format a price or numeric value for display on axes or tooltips.
     */
    static formatPrice(value: number, options: AxesStyleOptions | any): string {
        const settings = resolveLocaleSettings(options);
        
        const formatOptions: FormatNumberOptions = {
            locale: settings.locale,
            decimalSeparator: settings.decimalSeparator,
            thousandsSeparator: settings.thousandsSeparator,
            fractionDigits: options.numberFractionDigits,
            currency: options.useCurrency ? settings.currency : undefined,
            currencyDisplay: options.currencyDisplay,
            minimumFractionDigits: options.minimumFractionDigits,
            maximumFractionDigits: options.maximumFractionDigits,
            maximumSignificantDigits: options.maximumSignificantDigits,
            notation: options.numberNotation,
            tickSize: options.tickSize,
            unit: options.unit,
            unitPlacement: options.unitPlacement,
            conversionRate: options.conversionRate,
            displayCurrency: options.displayCurrency,
            metricType: options.metricType,
            showSign: options.showSign,
        };

        return formatNumber(value, formatOptions);
    }

    /**
     * Format a date based on the current locale and settings.
     */
    static formatDate(date: Date | number, options: AxesStyleOptions): string {
        const settings = resolveLocaleSettings(options);
        const fnsLocale = getDateFnsLocale(settings.locale);
        
        try {
            return dateFnsFormat(date, settings.dateFormat, { locale: fnsLocale });
        } catch (e) {
            console.error('Error formatting date:', e);
            return date.toString();
        }
    }

    /**
     * Interval-aware date/time label for crosshair and candle tooltip.
     * - Intraday intervals include time (hour/minute)
     * - Daily/weekly/monthly keep date-focused label
     */
    static formatDateForInterval(
        date: Date | number,
        options: AxesStyleOptions,
        intervalSeconds?: number,
        compact = false
    ): string {
        const settings = resolveLocaleSettings(options);
        const timestampSec =
            typeof date === 'number'
                ? Math.floor(date / (date > 1_000_000_000_000 ? 1000 : 1))
                : Math.floor(date.getTime() / 1000);

        const step = Math.max(1, Math.floor(intervalSeconds ?? 86400));
        const isIntraday = step < 86400;

        if (!isIntraday) {
            return this.formatDate(typeof date === 'number' ? new Date(timestampSec * 1000) : date, options);
        }

        const zone = options.timezone;
        const targetYear = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            ...(zone ? { timeZone: zone } : {}),
        }).format(new Date(timestampSec * 1000));
        const currentYear = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            ...(zone ? { timeZone: zone } : {}),
        }).format(new Date());
        const includeYear = targetYear !== currentYear;

        const intradayFmt: Intl.DateTimeFormatOptions = compact
            ? { day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : {
                  ...(includeYear ? { year: 'numeric' as const } : {}),
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              };

        try {
            return formatWithTimezone(
                timestampSec,
                intradayFmt,
                settings.locale || 'en-US',
                options.timezone
            );
        } catch {
            return this.formatDate(typeof date === 'number' ? new Date(timestampSec * 1000) : date, options);
        }
    }

    /**
     * Parse localized numeric input back into a canonical number.
     */
    static parseInput(input: string, options: AxesStyleOptions): number | null {
        const settings = resolveLocaleSettings(options);
        return parseNumber(input, settings.locale, settings.decimalSeparator);
    }

    /**
     * Sort an array of strings using locale-aware comparison.
     */
    static sortStrings(items: string[], locale: string = 'en-US'): string[] {
        return [...items].sort((a, b) => compareStrings(a, b, locale));
    }

    /**
     * Get a clean version of a formatted value for copying to clipboard.
     */
    static toClipboard(value: string | number): string {
        return normalizeClipboardValue(value);
    }
}
