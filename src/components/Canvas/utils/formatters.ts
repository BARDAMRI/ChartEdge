export function formatNumber(
    value: number,
    fractionDigits: number = 2,
    decimalSeparator: string = '.',
    thousandsSeparator: string = ',',
    locale?: string
): string {
    // If separators are default and locale is provided, we could use Intl.NumberFormat.
    // But we have custom logic for specific separators, so we'll stick to it.
    
    const fixedValue = value.toFixed(fractionDigits);
    const parts = fixedValue.split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    const decPart = parts[1];

    if (decPart && fractionDigits > 0) {
        return `${intPart}${decimalSeparator}${decPart}`;
    }
    return intPart;
}
