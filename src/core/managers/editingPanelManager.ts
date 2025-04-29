// editingPanelManager.ts

import { Drawing } from '../drawings/drawings';

export class EditingPanelManager {
    private container: HTMLElement;
    private selectedDrawing: Drawing | null = null;
    private onUpdate: () => void;
    private isEditingDefault = true;

    private defaultDrawingStyle = {
        color: '#ff9900',
        lineWidth: 2,
        lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
    };

    constructor(container: HTMLElement, onUpdate: () => void) {
        this.container = container;
        this.onUpdate = onUpdate;
        this.createPanel();
    }

    private createPanel() {
        this.container.innerHTML = `
            <div id="editing-panel" style="
                position: absolute;
                top: 10px;
                left: 10px;
                background: white;
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 1000;
                display: none;
                width: 220px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong>Editing</strong>
                    <button id="edit-close" style="
                        background: transparent;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                        color: #888;
                        padding: 8px;
                        margin: -8px;
                        line-height: 1;
                    ">×</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Color:</label>
                    <input type="color" id="edit-color" style="margin-left: 8px;"/>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Line Width:</label>
                    <input type="range" id="edit-width" min="1" max="10" value="2" style="width: 100%;"/>
                </div>
                <div>
                    <label>Line Style:</label>
                    <select id="edit-style" style="width: 100%; margin-top: 4px;">
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    private attachListeners() {
        const colorInput = this.container.querySelector('#edit-color') as HTMLInputElement;
        const widthInput = this.container.querySelector('#edit-width') as HTMLInputElement;
        const styleSelect = this.container.querySelector('#edit-style') as HTMLSelectElement;
        const closeButton = this.container.querySelector('#edit-close') as HTMLButtonElement;
        const panel = this.container.querySelector('#editing-panel') as HTMLDivElement;

        panel?.addEventListener('mousedown', (event) => {
            event.stopPropagation();
        });

        colorInput?.addEventListener('input', () => {
            if (this.selectedDrawing) {
                this.selectedDrawing.color = colorInput.value;
            } else {
                this.defaultDrawingStyle.color = colorInput.value;
            }
            this.onUpdate();
        });

        widthInput?.addEventListener('input', () => {
            const width = parseInt(widthInput.value, 10);
            if (this.selectedDrawing) {
                this.selectedDrawing.lineWidth = width;
            } else {
                this.defaultDrawingStyle.lineWidth = width;
            }
            this.onUpdate();
        });

        styleSelect?.addEventListener('change', () => {
            const style = styleSelect.value as 'solid' | 'dashed' | 'dotted';
            if (this.selectedDrawing) {
                this.selectedDrawing.lineStyle = style;
            } else {
                this.defaultDrawingStyle.lineStyle = style;
            }
            this.onUpdate();
        });

        closeButton?.addEventListener('click', () => {
            this.hide();
        });
    }

    showForDrawing(drawing: Drawing | null) {
        this.selectedDrawing = drawing;
        const panel = this.container.querySelector('#editing-panel') as HTMLDivElement;
        const colorInput = this.container.querySelector('#edit-color') as HTMLInputElement;
        const widthInput = this.container.querySelector('#edit-width') as HTMLInputElement;
        const styleSelect = this.container.querySelector('#edit-style') as HTMLSelectElement;

        if (panel) {
            panel.style.display = 'block';
        }

        if (drawing) {
            this.isEditingDefault = false;
            colorInput.value = drawing.color;
            widthInput.value = drawing.lineWidth.toString();
            styleSelect.value = drawing.lineStyle;
        } else {
            this.isEditingDefault = true;
            colorInput.value = this.defaultDrawingStyle.color;
            widthInput.value = this.defaultDrawingStyle.lineWidth.toString();
            styleSelect.value = this.defaultDrawingStyle.lineStyle;
        }
    }

    hide() {
        const panel = this.container.querySelector('#editing-panel') as HTMLDivElement;
        if (panel) {
            panel.style.display = 'none';
        }
        this.selectedDrawing = null;
        this.isEditingDefault = true;
        this.resetDefaultDrawingStyle();
    }

    private resetDefaultDrawingStyle() {
        this.defaultDrawingStyle = {
            color: '#ff9900',
            lineWidth: 2,
            lineStyle: 'solid',
        };
    }

    getDefaultDrawingStyle() {
        return this.defaultDrawingStyle;
    }
}