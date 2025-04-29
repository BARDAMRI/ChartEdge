// modeManager.ts

// Simple manager for tracking the current editing mode of the chart
export class ModeManager {
    private currentMode: string = 'none'; // Default mode: none

    constructor() {}

    /**
     * Set the current working mode (e.g., drawing line, moving objects, deleting).
     * @param mode - A string identifier for the mode.
     */
    setMode(mode: string): void {
        this.currentMode = mode;
    }

    /**
     * Get the currently active mode.
     * @returns The active mode string.
     */
    getMode(): string {
        return this.currentMode;
    }

    /**
     * Clear and reset the mode to 'none'.
     */
    resetMode(): void {
        this.currentMode = 'none';
    }
}