import { AxesStyleOptions } from '../types/chartOptions';
import { getLocaleDefaults, LocaleDefaults } from './i18n';

export interface ResolvedLocaleSettings extends LocaleDefaults {
    decimalSeparator: string;
    thousandsSeparator: string;
    dateFormat: string;
    locale: string;
    language: string;
    currency: string;
    useCurrency: boolean;
}

/**
 * Resolves the effective locale settings, considering both locale defaults and user overrides.
 */
export const resolveLocaleSettings = (options: AxesStyleOptions): ResolvedLocaleSettings => {
    const locale = options.locale || 'en-US';
    const defaults = getLocaleDefaults(locale);

    return {
        ...defaults,
        // Prioritize explicit overrides from options if provided
        decimalSeparator: options.decimalSeparator ?? defaults.decimalSeparator,
        thousandsSeparator: options.thousandsSeparator ?? defaults.thousandsSeparator,
        dateFormat: options.dateFormat ?? defaults.dateFormat,
        locale: locale,
        language: options.language || defaults.language,
        currency: options.currency || defaults.defaultCurrency || 'USD',
        useCurrency: typeof options.useCurrency === 'boolean' ? options.useCurrency : false,
    };
};
