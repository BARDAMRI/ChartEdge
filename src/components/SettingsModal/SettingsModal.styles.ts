import styled from 'styled-components';

export const ModalOverlay = styled.div`
    position: absolute;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 12, 20, 0.5);
    backdrop-filter: blur(6px);
    padding: 20px;
    box-sizing: border-box;
`;

export const ModalContainer = styled.div`
    width: 100%;
    max-width: 420px;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(22, 24, 38, 0.95) 0%, rgba(16, 18, 30, 0.98) 100%);
    border: 1px solid rgba(120, 130, 255, 0.3);
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    color: #e7ebff;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

export const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);

    h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: #fff;
    }
`;

export const IconButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: background 150ms ease, color 150ms ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    svg {
        width: 20px;
        height: 20px;
        display: block;
    }
`;

export const ModalBody = styled.div`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    flex: 1 1 auto;
`;

export const FormRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const FormLabel = styled.label`
    font-size: 14px;
    font-weight: 500;
    color: rgba(235, 240, 255, 0.85);
`;

export const ModalFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 16px 20px;
    gap: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.1);
`;

export const ModalButton = styled.button<{ $primary?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
    outline: none;

    ${({ $primary }) => $primary ? `
        background-color: rgba(62, 197, 255, 0.8);
        background-image: linear-gradient(180deg, rgba(62, 197, 255, 1), rgba(90, 72, 222, 1));
        border: 1px solid transparent;
        color: #fff;
        box-shadow: 0 4px 12px rgba(90, 72, 222, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);

        &:hover {
            box-shadow: 0 6px 16px rgba(90, 72, 222, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }

        &:active {
            transform: translateY(0);
            box-shadow: 0 2px 6px rgba(90, 72, 222, 0.4);
        }
    ` : `
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.8);

        &:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
        }
    `}

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const SwitchToggle = styled.div<{ $checked: boolean }>`
    position: relative;
    width: 44px;
    height: 24px;
    background: ${({ $checked }) => $checked ? 'linear-gradient(180deg, #3EC5FF, #5A48DE)' : 'rgba(255, 255, 255, 0.15)'};
    border-radius: 12px;
    cursor: pointer;
    transition: background 200ms ease;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);

    &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: ${({ $checked }) => $checked ? '22px' : '2px'};
        width: 20px;
        height: 20px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        transition: left 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
`;

export const NumberInput = styled.input`
    width: 60px;
    height: 32px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: #fff;
    padding: 0 8px;
    font-size: 14px;
    text-align: center;
    outline: none;

    &:focus {
        border-color: rgba(62, 197, 255, 0.8);
        box-shadow: 0 0 0 2px rgba(62, 197, 255, 0.2);
    }
`;

export const SelectDropdown = styled.select`
    height: 32px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: #fff;
    padding: 0 8px;
    font-size: 14px;
    outline: none;
    cursor: pointer;

    option {
        background: #1a1c29;
        color: #fff;
    }

    &:focus {
        border-color: rgba(62, 197, 255, 0.8);
    }
`;
