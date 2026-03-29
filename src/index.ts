/**
 * **Default npm entry — basic charts:** `TickUpStage`, data helpers, overlays, drawings (types +
 * factories), snapshots, and branding. Build your own chrome around the canvas.
 *
 * **Full product UI** (Pulse, Flow, Command, Desk, `TickUpHost`, shape classes, …) is
 * published separately as `import … from 'tickup/full'`.
 */

export type {Interval} from './types/Interval';
export type {LiveDataPlacement, LiveDataApplyResult} from './types/liveData';
export {applyLiveDataMerge, normalizeInterval, normalizeIntervals, dedupeByTimePreferLast} from './utils/liveDataMerge';
export type {ChartSnapshotMeta} from './utils/captureChartRegion';
export {
    buildChartSnapshotFileName,
    sanitizeChartSnapshotToken,
    contrastingFooterTextColor,
    captureChartRegionToPngDataUrl,
} from './utils/captureChartRegion';
export type {TimeRange} from './types/Graph';
export type {ChartDimensionsData} from './types/Graph';
export type {OverlayWithCalc, OverlaySeries, OverlayOptions} from './types/overlay';
export type {ShapeBaseArgs, Drawing} from './components/Drawing/types';
export {ShapeType} from './components/Drawing/types';
export type {DrawingSpec, DrawingPatch, DrawingInput} from './components/Drawing/drawHelper';
export {drawingFromSpec, applyDrawingPatch, isDrawingPatch} from './components/Drawing/drawHelper';
export type {DrawingSnapshot, DrawingQuery, DrawingWithZIndex} from './components/Drawing/drawingQuery';
export {
    shapeToSnapshot,
    filterDrawingsWithMeta,
    queryDrawingsToSnapshots,
    filterDrawingInstances,
} from './components/Drawing/drawingQuery';
export type {ChartContextInfo} from './types/chartContext';
export type {TickUpStageHandle, TickUpStageProps} from './components/Canvas/TickUpStage';
export {TickUpStage} from './components/Canvas/TickUpStage';
export type {DrawingStyleOptions, DrawingPoint, CanvasPoint} from './types/Drawings';
export type {IDrawingShape} from './components/Drawing/IDrawingShape';
export type {
    LineShapeArgs,
    RectangleShapeArgs,
    CircleShapeArgs,
    TriangleShapeArgs,
    AngleShapeArgs,
    ArrowShapeArgs,
    PolylineShapeArgs,
    CustomSymbolShapeArgs,
} from './types/Drawings';
export {AxesPosition} from './types/types';
export {TimeDetailLevel, ChartType} from './types/chartOptions';
export type {ChartOptions} from './types/chartOptions';
export type {DeepRequired} from './types/types';
export {OverlayPriceKey, OverlayKind} from './types/overlay';
export {TickUpMark} from './branding/TickUpMark';
export type {TickUpThemeVariant} from './branding/TickUpMark';
export {TickUpAttribution} from './branding/TickUpAttribution';
export type {TickUpAttributionProps} from './branding/TickUpAttribution';
export {Mode, ModeProvider, useMode} from './contexts/ModeContext';
export {withOverlayStyle, OverlaySpecs, overlay} from './components/Canvas/utils/drawOverlay';
export {GlobalStyle} from './styles/App.styles';
export {generateDrawingShapeId} from './components/Drawing/IDrawingShape';

export type {TickUpChartEngine} from './engines/TickUpEngine';
export {TickUpPrime, TickUpStandardEngine} from './engines/prime/TickUpPrime';
export {TICKUP_PRIME_PRIMARY, TICKUP_PRIME_SECONDARY, TICKUP_PRIME_TEXT} from './engines/prime/TickUpPrime';
export {
    timeToX,
    xToTime,
    priceToY,
    yToPrice,
    interpolatedCloseAtTime,
    lerp,
    xFromCenter,
    xFromStart,
} from './components/Canvas/utils/GraphHelpers';
