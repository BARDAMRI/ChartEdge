/**
 * Full public API: product shells (`TickUpCommand`, `TickUpHost`, …), optional shape classes,
 * and deprecated aliases. Published as **`tickup/full`**.
 *
 * For canvas-focused integration, prefer the default **`tickup`** entry (see `index.ts`).
 */

export type {TickUpHostProps, TickUpHostHandle} from './components/TickUpHost';
export {TickUpHost} from './components/TickUpHost';
export type {TickUpProductId} from './types/tickupProducts';
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
export type {TimeRange, VisibleViewRanges} from './types/Graph';
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
/** @deprecated Use {@link TickUpStageHandle} */
export type {ChartStageHandle, ChartStageProps} from './components/Canvas/ChartStage';
/** @deprecated Use {@link TickUpStage} */
export {ChartStage} from './components/Canvas/ChartStage';
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
export {OverlayPriceKey, OverlayKind} from './types/overlay';

export {
    TickUpPulse,
    TickUpFlow,
    TickUpCommand,
    TickUpDesk,
    TickUpPrimeTier,
} from './components/TickUpProducts';
export type {
    TickUpPulseProps,
    TickUpFlowProps,
    TickUpCommandProps,
    TickUpDeskProps,
    TickUpPrimeTierProps,
} from './components/TickUpProducts';

export type {TickUpChartEngine} from './engines/TickUpEngine';
export {
    TickUpPrime,
    TickUpStandardEngine,
    createTickUpPrimeEngine,
    getTickUpPrimeThemePatch,
} from './engines/prime/TickUpPrime';
export {TICKUP_PRIME_PRIMARY, TICKUP_PRIME_SECONDARY, TICKUP_PRIME_TEXT} from './engines/prime/TickUpPrime';

export {TickUpMark} from './branding/TickUpMark';
export type {TickUpThemeVariant} from './branding/TickUpMark';
export {TickUpAttribution} from './branding/TickUpAttribution';
export type {TickUpAttributionProps} from './branding/TickUpAttribution';
export {ShapePropertiesModal} from './components/ShapePropertiesModal/ShapePropertiesModal';
export type {ShapePropertiesFormState} from './components/ShapePropertiesModal/applyShapeProperties';
export type {ModalThemeVariant} from './components/SettingsModal/SettingsModal.styles';
export {Mode, ModeProvider, useMode} from './contexts/ModeContext';
export {withOverlayStyle, OverlaySpecs, overlay} from './components/Canvas/utils/drawOverlay';
export {GlobalStyle} from './styles/App.styles';
export {generateDrawingShapeId} from './components/Drawing/IDrawingShape';

export {CustomSymbolShape} from './components/Drawing/CustomSymbolShape';
export {LineShape} from './components/Drawing/LineShape';
export {RectangleShape} from './components/Drawing/RectangleShape';
export {CircleShape} from './components/Drawing/CircleShape';
export {TriangleShape} from './components/Drawing/TriangleShape';
export {AngleShape} from './components/Drawing/AngleShape';
export {ArrowShape} from './components/Drawing/ArrowShape';
export {Polyline} from './components/Drawing/Polyline';

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

export type {ChartOptions} from './types/chartOptions';
export type {DeepRequired} from './types/types';
export {ChartTheme} from './types/types';
