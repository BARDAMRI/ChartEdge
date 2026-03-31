import React from 'react';
import ReactDOM from 'react-dom';
import {
    AlertOverlay,
    AlertContainer,
    AlertHeader,
    AlertTitle,
    AlertBody,
    AlertFooter,
    AlertButton,
    type AlertThemeVariant
} from './AlertModal.styles';
import { ChartTheme } from '../../types/types';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string | React.ReactNode;
    themeVariant?: AlertThemeVariant;
    /** If true, the modal renders within a portal to the document body. Defaults to true. */
    usePortal?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    themeVariant = ChartTheme.dark,
    usePortal = true
}) => {
    if (!isOpen) return null;

    const content = (
        <AlertOverlay $variant={themeVariant} onClick={onClose}>
            <AlertContainer $variant={themeVariant} onClick={e => e.stopPropagation()}>
                <AlertHeader $variant={themeVariant}>
                    <AlertTitle $variant={themeVariant}>{title}</AlertTitle>
                </AlertHeader>
                <AlertBody $variant={themeVariant}>
                    {message}
                </AlertBody>
                <AlertFooter $variant={themeVariant}>
                    <AlertButton $variant={themeVariant} onClick={onClose}>
                        Close
                    </AlertButton>
                </AlertFooter>
            </AlertContainer>
        </AlertOverlay>
    );

    if (usePortal && typeof document !== 'undefined') {
        return ReactDOM.createPortal(content, document.body);
    }

    return content;
};
