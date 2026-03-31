import styled, { keyframes } from 'styled-components';
import { ChartTheme } from '../../types/types';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translate(-50%, -40%); opacity: 0; }
  to { transform: translate(-50%, -50%); opacity: 1; }
`;

export type AlertThemeVariant = ChartTheme;

interface ThemeProps {
    $variant: AlertThemeVariant;
}

export const AlertOverlay = styled.div<ThemeProps>`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$variant === ChartTheme.dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.3)'};
    backdrop-filter: blur(2px);
    z-index: 5000;
    animation: ${fadeIn} 0.2s ease-out;
`;

export const AlertContainer = styled.div<ThemeProps>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(440px, 90vw);
    background: ${props => props.$variant === ChartTheme.dark ? '#1A1D23' : '#ffffff'};
    border: 1px solid ${props => props.$variant === ChartTheme.dark ? '#2D3139' : '#e2e8f0'};
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ${slideUp} 0.25s cubic-bezier(0, 0, 0.2, 1);
`;

export const AlertHeader = styled.div<ThemeProps>`
    padding: 20px 24px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const AlertTitle = styled.h3<ThemeProps>`
    margin: 0;
    padding: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.$variant === ChartTheme.dark ? '#F8FAFC' : '#1E293B'};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

export const AlertBody = styled.div<ThemeProps>`
    padding: 4px 24px 24px;
    font-size: 15px;
    line-height: 1.5;
    color: ${props => props.$variant === ChartTheme.dark ? '#94A3B8' : '#64748B'};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

export const AlertFooter = styled.div<ThemeProps>`
    padding: 12px 16px;
    border-top: 1px solid ${props => props.$variant === ChartTheme.dark ? '#2D3139' : '#f1f5f9'};
    background: ${props => props.$variant === ChartTheme.dark ? '#20242B' : '#f8fafc'};
    display: flex;
    justify-content: flex-end;
`;

export const AlertButton = styled.button<ThemeProps>`
    padding: 8px 16px;
    background: transparent;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 700;
    color: #3EC5FF;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
        background: ${props => props.$variant === ChartTheme.dark ? 'rgba(62, 197, 255, 0.1)' : 'rgba(62, 197, 255, 0.05)'};
    }

    &:active {
        background: ${props => props.$variant === ChartTheme.dark ? 'rgba(62, 197, 255, 0.2)' : 'rgba(62, 197, 255, 0.1)'};
    }
`;
