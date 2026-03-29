import styled, { keyframes, css } from 'styled-components';

/** Pass from app theme (e.g. TickUpHost `themeVariant`). */
export type ModalThemeVariant = 'light' | 'dark';

const slideInLeft = keyframes`
    from { transform: translateX(30px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
`;

const slideInRight = keyframes`
    from { transform: translateX(-30px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
`;



export const ModalOverlay = styled.div<{ $variant?: ModalThemeVariant }>`
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    box-sizing: border-box;
    overflow: hidden;
    backdrop-filter: blur(8px);
    background: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(45, 55, 80, 0.28)' : 'rgba(10, 12, 22, 0.62)'};
`;

/* ─── Panel: full-width, full-height card ────────────────────────────────── */
export const ModalContainer = styled.div<{ $variant?: ModalThemeVariant }>`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${({ $variant }) =>
        $variant === 'light'
            ? 'linear-gradient(180deg, #ffffff 0%, #f0f4fc 100%)'
            : 'linear-gradient(180deg, rgba(18, 20, 36, 0.98) 0%, rgba(12, 14, 26, 0.99) 100%)'};
    color: ${({ $variant }) => ($variant === 'light' ? '#1a2332' : '#e7ebff')};
    border-radius: 0; /* Full-cover has no rounding */
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

/* ─── Header ─────────────────────────────────────────────────────────────── */
export const ModalHeader = styled.div<{ $variant?: ModalThemeVariant }>`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding: clamp(8px, 2.5vmin, 16px) clamp(12px, 3vmin, 20px);
    border-bottom: 1px solid
        ${({ $variant }) => ($variant === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)')};
    background: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.025)'};

    h2 {
        margin: 0;
        font-size: clamp(12px, 2.5vmin, 17px);
        font-weight: 600;
        letter-spacing: 0.4px;
        color: ${({ $variant }) => ($variant === 'light' ? '#111827' : '#fff')};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

export const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: clamp(6px, 1.5vmin, 12px);
    min-width: 0;
`;

/* ─── Icon buttons (close, back) ─────────────────────────────────────────── */
export const IconButton = styled.button<{ $variant?: 'back' | 'close'; $theme?: ModalThemeVariant }>`
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: clamp(26px, 4.5vmin, 34px);
    height: clamp(26px, 4.5vmin, 34px);
    border-radius: 8px;
    border: none;
    background: transparent;
    color: ${({ $variant, $theme }) => {
        if ($variant === 'back') return '#3EC5FF';
        return $theme === 'light' ? 'rgba(17, 24, 39, 0.55)' : 'rgba(255, 255, 255, 0.55)';
    }};
    cursor: pointer;
    transition: background 140ms ease, color 140ms ease;

    &:hover {
        background: ${({ $theme }) => ($theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)')};
        color: ${({ $variant, $theme }) => {
            if ($variant === 'back') return '#60D3FF';
            return $theme === 'light' ? '#111827' : '#fff';
        }};
    }

    svg {
        width: clamp(13px, 2.5vmin, 18px);
        height: clamp(13px, 2.5vmin, 18px);
        display: block;
    }
`;

export const BackArrowIcon = styled.div`
    display: block;
    width: clamp(7px, 1.4vmin, 10px);
    height: clamp(7px, 1.4vmin, 10px);
    border-left: 2.5px solid currentColor;
    border-bottom: 2.5px solid currentColor;
    transform: rotate(45deg);
    flex-shrink: 0;
    box-sizing: content-box; 
    margin-left: clamp(2px, 0.5vmin, 4px);

    [dir='rtl'] & {
        transform: rotate(-135deg);
        margin-left: 0;
        margin-right: clamp(2px, 0.5vmin, 4px);
    }
`;

/* ─── Body (scrollable) ──────────────────────────────────────────────────── */
export const ModalBody = styled.div`
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: clamp(6px, 2vmin, 16px) clamp(10px, 2.5vmin, 20px);
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 1.2vmin, 10px);

    /* Thin custom scrollbar */
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
`;

/* ─── Category tiles (top-level navigation) ──────────────────────────────── */
export const CategoryTile = styled.button<{ $variant?: ModalThemeVariant }>`
    display: flex;
    align-items: center;
    gap: clamp(8px, 1.8vmin, 14px);
    width: 100%;
    padding: clamp(8px, 1.8vmin, 14px) clamp(10px, 2vmin, 16px);
    border-radius: clamp(6px, 1.2vmin, 10px);
    border: 1px solid
        ${({ $variant }) =>
            $variant === 'light' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(120, 130, 255, 0.15)'};
    background: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.04)'};
    color: ${({ $variant }) => ($variant === 'light' ? '#1e293b' : '#e7ebff')};
    font-size: clamp(11px, 2vmin, 14px);
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, transform 100ms ease;

    &:hover {
        background: ${({ $variant }) =>
            $variant === 'light' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(62, 197, 255, 0.08)'};
        border-color: ${({ $variant }) =>
            $variant === 'light' ? 'rgba(59, 130, 246, 0.45)' : 'rgba(62, 197, 255, 0.3)'};
        transform: translateX(2px);
    }

    .tile-icon {
        font-size: clamp(14px, 2.5vmin, 20px);
        line-height: 1;
        flex-shrink: 0;
    }

    .tile-label { flex: 1; }

    .tile-arrow {
        font-size: clamp(10px, 1.8vmin, 14px);
        color: ${({ $variant }) =>
            $variant === 'light' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255,255,255,0.35)'};
        flex-shrink: 0;
    }
`;

/* ─── Sub-menu content area (animated on entry) ──────────────────────────── */
export const SubMenuPane = styled.div<{ $back?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 1.2vmin, 10px);
    animation: ${({ $back }) => css`${$back ? slideInRight : slideInLeft} 180ms ease`};
`;

/* ─── Individual form rows ───────────────────────────────────────────────── */
export const FormRow = styled.div<{ $variant?: ModalThemeVariant }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(6px, 1.5vmin, 12px) clamp(8px, 1.8vmin, 14px);
    border-radius: clamp(6px, 1vmin, 8px);
    background: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)'};
    gap: 8px;
`;

export const FormLabel = styled.label<{ $variant?: ModalThemeVariant }>`
    font-size: clamp(11px, 2vmin, 13px);
    font-weight: 500;
    color: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(235, 240, 255, 0.82)'};
    flex: 1;
    min-width: 0;
`;

/* ─── Footer ─────────────────────────────────────────────────────────────── */
export const ModalFooter = styled.div<{ $variant?: ModalThemeVariant }>`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    padding: clamp(6px, 1.5vmin, 12px) clamp(10px, 2.5vmin, 20px);
    gap: clamp(6px, 1.2vmin, 10px);
    border-top: 1px solid
        ${({ $variant }) => ($variant === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)')};
    background: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 0, 0, 0.12)'};
`;

export const ModalButton = styled.button<{ $primary?: boolean; $variant?: ModalThemeVariant }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: clamp(4px, 1vmin, 8px);
    height: clamp(28px, 4.5vmin, 36px);
    padding: 0 clamp(10px, 2vmin, 16px);
    border-radius: 8px;
    font-size: clamp(11px, 1.9vmin, 14px);
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
    outline: none;
    white-space: nowrap;

    ${({ $primary, $variant }) =>
        $primary
            ? `
        background-image: linear-gradient(180deg, rgba(62,197,255,1), rgba(90,72,222,1));
        border: 1px solid transparent;
        color: #fff;
        box-shadow: 0 4px 12px rgba(90,72,222,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        &:hover { box-shadow: 0 6px 16px rgba(90,72,222,0.6); transform: translateY(-1px); }
        &:active { transform: translateY(0); }
    `
            : $variant === 'light'
              ? `
        background: rgba(0,0,0,0.05);
        border: 1px solid rgba(0,0,0,0.12);
        color: rgba(17,24,39,0.85);
        &:hover { background: rgba(0,0,0,0.08); color: #111827; }
    `
              : `
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.78);
        &:hover { background: rgba(255,255,255,0.12); color: #fff; }
    `}

    svg { width: clamp(12px, 2vmin, 16px); height: clamp(12px, 2vmin, 16px); }
`;

/* ─── Toggle switch ──────────────────────────────────────────────────────── */
export const SwitchToggle = styled.div<{ $checked: boolean; $disabled?: boolean }>`
    position: relative;
    flex-shrink: 0;
    width: clamp(32px, 5.5vmin, 44px);
    height: clamp(18px, 3vmin, 24px);
    background: ${({ $checked }) => $checked
        ? 'linear-gradient(180deg, #3EC5FF, #5A48DE)'
        : 'rgba(255,255,255,0.14)'};
    border-radius: 100px;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    opacity: ${({ $disabled }) => ($disabled ? 0.42 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
    transition: background 200ms ease;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);

    &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: ${({ $checked }) => $checked ? 'calc(100% - 2px - clamp(14px, 2.6vmin, 20px))' : '2px'};
        width: clamp(14px, 2.6vmin, 20px);
        height: clamp(14px, 2.6vmin, 20px);
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: left 180ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
`;

/* ─── Number input / select ──────────────────────────────────────────────── */
export const NumberInput = styled.input<{ $variant?: ModalThemeVariant }>`
    flex-shrink: 0;
    width: clamp(44px, 7vmin, 60px);
    height: clamp(24px, 4vmin, 32px);
    background: ${({ $variant }) =>
        $variant === 'light' ? '#ffffff' : 'rgba(0,0,0,0.25)'};
    border: 1px solid
        ${({ $variant }) => ($variant === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)')};
    border-radius: 6px;
    color: ${({ $variant }) => ($variant === 'light' ? '#111827' : '#fff')};
    padding: 0 6px;
    font-size: clamp(11px, 1.9vmin, 14px);
    text-align: center;
    outline: none;
    &:focus {
        border-color: rgba(62, 197, 255, 0.8);
        box-shadow: 0 0 0 2px rgba(62, 197, 255, 0.2);
    }
`;

export const ColorInput = styled.input`
    flex-shrink: 0;
    width: clamp(24px, 4vmin, 32px);
    height: clamp(24px, 4vmin, 32px);
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    padding: 0;
    outline: none;
    &::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    &::-webkit-color-swatch {
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }
`;


export const SelectDropdown = styled.select<{ $variant?: ModalThemeVariant }>`
    flex-shrink: 0;
    height: clamp(24px, 4vmin, 32px);
    background: ${({ $variant }) =>
        $variant === 'light' ? '#ffffff' : 'rgba(0,0,0,0.25)'};
    border: 1px solid
        ${({ $variant }) => ($variant === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)')};
    border-radius: 6px;
    color: ${({ $variant }) => ($variant === 'light' ? '#111827' : '#fff')};
    padding: 0 clamp(4px, 0.8vmin, 8px);
    font-size: clamp(11px, 1.9vmin, 14px);
    outline: none;
    cursor: pointer;
    option {
        background: ${({ $variant }) => ($variant === 'light' ? '#ffffff' : '#1a1c29')};
        color: ${({ $variant }) => ($variant === 'light' ? '#111827' : '#fff')};
    }
    &:focus {
        border-color: rgba(62, 197, 255, 0.8);
    }
`;

/* ─── Section divider ────────────────────────────────────────────────────── */
export const SectionTitle = styled.p<{ $variant?: ModalThemeVariant }>`
    margin: clamp(4px, 1vmin, 8px) 0 clamp(2px, 0.5vmin, 4px);
    font-size: clamp(9px, 1.6vmin, 11px);
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: ${({ $variant }) =>
        $variant === 'light' ? 'rgba(79, 70, 229, 0.85)' : 'rgba(120, 150, 255, 0.7)'};
    padding-left: clamp(6px, 1.2vmin, 10px);
`;

/** Themed text field (e.g. rgba / hex fill colors) */
export const ModalTextInput = styled.input<{ $variant?: ModalThemeVariant }>`
    flex: 1;
    min-width: 0;
    height: clamp(28px, 4.5vmin, 36px);
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid
        ${({ $variant }) => ($variant === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)')};
    background: ${({ $variant }) => ($variant === 'light' ? '#ffffff' : 'rgba(0,0,0,0.25)')};
    color: ${({ $variant }) => ($variant === 'light' ? '#111827' : '#fff')};
    font-size: clamp(11px, 1.9vmin, 14px);
    outline: none;
    box-sizing: border-box;
    &:focus {
        border-color: rgba(62, 197, 255, 0.8);
        box-shadow: 0 0 0 2px rgba(62, 197, 255, 0.15);
    }
    &::placeholder {
        color: ${({ $variant }) =>
            $variant === 'light' ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.35)'};
    }
`;
