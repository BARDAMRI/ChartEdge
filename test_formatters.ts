import { formatNumber } from './src/components/Canvas/utils/formatters.ts';

const runTests = () => {
    console.log('--- Unit & Placement Tests ---');
    console.log('BTC Suffix:', formatNumber(100.5, { unit: ' BTC', unitPlacement: 'suffix' }));
    console.log('BTC Prefix:', formatNumber(100.5, { unit: 'BTC ', unitPlacement: 'prefix' }));
    console.log('Percent Native:', formatNumber(0.055, { unit: '%' }));

    console.log('\n--- Notation & Abbreviations ---');
    console.log('Compact 1.2M:', formatNumber(1200000, { notation: 'compact' }));
    console.log('Compact 45K:', formatNumber(45600, { notation: 'compact' }));
    console.log('Scientific:', formatNumber(0.00000012, { notation: 'scientific' }));

    console.log('\n--- Precision & Tick Size ---');
    console.log('Fixed 4 Decimals:', formatNumber(1.23, { fractionDigits: 4 }));
    console.log('Tick Size 0.25 (1.12 -> 1.00):', formatNumber(1.12, { tickSize: 0.25 }));
    console.log('Tick Size 0.25 (1.18 -> 1.25):', formatNumber(1.18, { tickSize: 0.25 }));
};

runTests();
