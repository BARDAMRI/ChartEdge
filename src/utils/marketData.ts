import {TradingSession} from "../types/chartOptions";

export interface ExchangeConfig {
    name: string;
    timezone: string;
    sessions: TradingSession[];
}

export const EXCHANGES: Record<string, ExchangeConfig> = {
    'NYSE': {
        name: 'New York Stock Exchange',
        timezone: 'America/New_York',
        sessions: [
            { dayOfWeek: 1, start: '09:30', end: '16:00' },
            { dayOfWeek: 2, start: '09:30', end: '16:00' },
            { dayOfWeek: 3, start: '09:30', end: '16:00' },
            { dayOfWeek: 4, start: '09:30', end: '16:00' },
            { dayOfWeek: 5, start: '09:30', end: '16:00' },
        ]
    },
    'TASE': {
        name: 'Tel Aviv Stock Exchange',
        timezone: 'Asia/Jerusalem',
        sessions: [
            { dayOfWeek: 0, start: '10:00', end: '15:50' }, // Sunday
            { dayOfWeek: 1, start: '10:00', end: '17:25' },
            { dayOfWeek: 2, start: '10:00', end: '17:25' },
            { dayOfWeek: 3, start: '10:00', end: '17:25' },
            { dayOfWeek: 4, start: '10:00', end: '17:25' },
        ]
    }
};

export function getExchangeConfig(exchange: string): ExchangeConfig | undefined {
    return EXCHANGES[exchange.toUpperCase()];
}
