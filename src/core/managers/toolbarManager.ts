// toolbarManager.ts

import {ModeManager} from './modeManager';

/**
 * Represents a button in the toolbar.
 */
interface ToolbarButton {
    label: string;
    tooltip: string;
    subActions?: SubAction[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}


/**
 * Represents a sub-action inside a submenu.
 */
interface SubAction {
    label: string;
    mode: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

/**
 * Manages the rendering and interactions of the toolbar.
 */
export class ToolbarManager {
    private ctx: CanvasRenderingContext2D;
    private buttons: ToolbarButton[] = [];
    private modeManager: ModeManager;
    private hoveredButtonIndex: number | null = null;
    private hoveredSubActionIndex: number | null = null;
    private expandedButtonIndex: number | null = null;

    private readonly buttonWidth = 30;
    private readonly buttonHeight = 30;
    private readonly buttonMargin = 5;
    private readonly xOffset = 5;
    private readonly yOffset = 5;

    constructor(ctx: CanvasRenderingContext2D, modeManager: ModeManager) {
        this.ctx = ctx;
        this.modeManager = modeManager;
    }

    /**
     * Adds a new button to the toolbar.
     * @param button - Button configuration.
     */
    addButton(button: ToolbarButton): void {
        this.buttons.push(button);
    }

    /**
     * Draws the toolbar and any expanded submenu.
     */
    draw(): void {
        this.buttons.forEach((button, index) => {
            const x = this.xOffset;
            const y = this.yOffset + index * (this.buttonHeight + this.buttonMargin);

            button.x = x;
            button.y = y;
            button.width = this.buttonWidth;
            button.height = this.buttonHeight;

            this.ctx.fillStyle = (index === this.hoveredButtonIndex) ? '#ddd' : '#f0f0f0';
            this.ctx.fillRect(x, y, this.buttonWidth, this.buttonHeight);

            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.label, x + this.buttonWidth / 2, y + this.buttonHeight / 2);
        });

        if (this.expandedButtonIndex !== null) {
            this.drawSubmenu(this.expandedButtonIndex);
        }
    }

    /**
     * Draws the submenu for a given button.
     * @param buttonIndex - Index of the expanded button.
     */
    private drawSubmenu(buttonIndex: number): void {
        const button = this.buttons[buttonIndex];
        if (!button.subActions) return;

        const x = this.xOffset + this.buttonWidth + 10;
        const baseY = this.yOffset + buttonIndex * (this.buttonHeight + this.buttonMargin);

        button.subActions.forEach((subAction, subIndex) => {
            const y = baseY + subIndex * (this.buttonHeight + this.buttonMargin);

            subAction.x = x;
            subAction.y = y;
            subAction.width = 100;
            subAction.height = this.buttonHeight;

            this.ctx.fillStyle = (subIndex === this.hoveredSubActionIndex) ? '#ccc' : '#eee';
            this.ctx.fillRect(x, y, 100, this.buttonHeight);

            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(subAction.label, x + 5, y + this.buttonHeight / 2);
        });
    }

    /**
     * Handles mouse move events for hover detection.
     */
    handleMouseMove(x: number, y: number): void {
        this.hoveredButtonIndex = this.getButtonIndexAtPosition(x, y);
        this.hoveredSubActionIndex = this.getSubActionIndexAtPosition(x, y);
    }

    /**
     * Handles mouse click events.
     */
    handleMouseClick(x: number, y: number): boolean | string {
        const subActionIndex = this.getSubActionIndexAtPosition(x, y);
        if (subActionIndex !== null && this.expandedButtonIndex !== null) {
            const button = this.buttons[this.expandedButtonIndex];
            if (button.subActions && subActionIndex >= 0 && subActionIndex < button.subActions.length) {
                const subAction = button.subActions[subActionIndex];
                this.modeManager.setMode(subAction.mode);
                this.expandedButtonIndex = null;
                this.draw();
                return "open-editing-panel"; // Only if a real sub-action was selected
            } else {
                // Clicked empty submenu area: close submenu but do not open editing panel
                this.expandedButtonIndex = null;
                this.draw();
                return false;
            }
        }

        const buttonIndex = this.getButtonIndexAtPosition(x, y);
        if (buttonIndex !== null) {
            if (this.expandedButtonIndex === buttonIndex) {
                this.expandedButtonIndex = null;
            } else {
                this.expandedButtonIndex = buttonIndex;
            }
            this.draw();
            return true; // Clicked on a toolbar main button
        }

        this.expandedButtonIndex = null;
        this.draw();
        return false; // Clicked outside the toolbar
    }

    /**
     * Get the index of the button at a mouse position.
     */
    private getButtonIndexAtPosition(x: number, y: number): number | null {
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            if (
                button.x !== undefined && button.y !== undefined &&
                x >= button.x && x <= button.x + button.width! &&
                y >= button.y && y <= button.y + button.height!
            ) {
                return i;
            }
        }
        return null;
    }

    /**
     * Get the index of the sub-action at a mouse position.
     */
    private getSubActionIndexAtPosition(x: number, y: number): number | null {
        if (this.expandedButtonIndex === null) return null;
        const button = this.buttons[this.expandedButtonIndex];
        if (!button.subActions) return null;

        for (let i = 0; i < button.subActions.length; i++) {
            const subAction = button.subActions[i];
            if (
                subAction.x !== undefined && subAction.y !== undefined &&
                x >= subAction.x && x <= subAction.x + subAction.width! &&
                y >= subAction.y && y <= subAction.y + subAction.height!
            ) {
                return i;
            }
        }
        return null;
    }
}