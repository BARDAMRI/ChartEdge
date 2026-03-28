// Props and Types
export type {SimpleChartEdgeProps, SimpleChartEdgeHandle} from './components/SimpleChartEdge';
export type {ChartEdgeHostProps, ChartEdgeHostHandle} from './components/SimpleChartEdge';
export {ChartEdgeHost} from './components/SimpleChartEdge';
export type {ChartEdgeProductId} from './types/chartProducts';
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
export type {ChartEdgeStageHandle, ChartEdgeStageProps} from './components/Canvas/ChartEdgeStage';
export {ChartEdgeStage} from './components/Canvas/ChartEdgeStage';
/** @deprecated Use {@link ChartEdgeStageHandle} */
export type {ChartStageHandle, ChartStageProps} from './components/Canvas/ChartStage';
/** @deprecated Use {@link ChartEdgeStage} */
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
    CustomSymbolShapeArgs
} from './types/Drawings';
// Enums
export {AxesPosition} from './types/types';
export {TimeDetailLevel, ChartType} from './types/chartOptions';
export {OverlayPriceKey, OverlayKind} from './types/overlay';

// Components — product lines (ChartEdge-branded tiers)
export {
    ChartEdgePulse,
    ChartEdgeFlow,
    ChartEdgeCommand,
    ChartEdgeDesk,
    ChartEdgeApex,
} from './components/ChartEdgeProducts';
export type {
    ChartEdgePulseProps,
    ChartEdgeFlowProps,
    ChartEdgeCommandProps,
    ChartEdgeDeskProps,
    ChartEdgeApexProps,
} from './components/ChartEdgeProducts';

export {SimpleChartEdge} from './components/SimpleChartEdge';
export {ChartEdgeMark} from './branding/ChartEdgeMark';
export type {ChartEdgeThemeVariant} from './branding/ChartEdgeMark';
export {ChartEdgeAttribution} from './branding/ChartEdgeAttribution';
export type {ChartEdgeAttributionProps} from './branding/ChartEdgeAttribution';
export {ShapePropertiesModal} from './components/ShapePropertiesModal/ShapePropertiesModal';
export type {ShapePropertiesFormState} from './components/ShapePropertiesModal/applyShapeProperties';
export type {ModalThemeVariant} from './components/SettingsModal/SettingsModal.styles';
export {ModeProvider, useMode} from './contexts/ModeContext';
export {withOverlayStyle, OverlaySpecs, overlay} from './components/Canvas/utils/drawOverlay';
export {GlobalStyle} from './styles/App.styles';
export {generateDrawingShapeId} from './components/Drawing/IDrawingShape';


// Drawing Shapes
export {CustomSymbolShape} from './components/Drawing/CustomSymbolShape';
export {LineShape} from './components/Drawing/LineShape';
export {RectangleShape} from './components/Drawing/RectangleShape';
export {CircleShape} from './components/Drawing/CircleShape';
export {TriangleShape} from './components/Drawing/TriangleShape';
export {AngleShape} from './components/Drawing/AngleShape';
export {ArrowShape} from './components/Drawing/ArrowShape';
export {Polyline} from './components/Drawing/Polyline';


// graph helpers
export {
    timeToX, xToTime, priceToY, yToPrice, interpolatedCloseAtTime, lerp, xFromCenter, xFromStart
} from './components/Canvas/utils/GraphHelpers';