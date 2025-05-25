export interface IDrawingShape {
    draw(ctx: CanvasRenderingContext2D): void;
    isHit(x: number, y: number): boolean;
}