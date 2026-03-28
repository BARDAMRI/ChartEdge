import type {DrawingPoint, DrawingStyleOptions} from '../../types/Drawings';
import {CustomSymbolShape} from './CustomSymbolShape';
import type {IDrawingShape} from './IDrawingShape';
import {ShapeType} from './types';

/** Plain, JSON-friendly view of a drawing (ids, geometry, style) for querying and persistence. */
export type DrawingSnapshot = {
    id: string;
    type: ShapeType;
    points: DrawingPoint[];
    style: DrawingStyleOptions;
    /** Order in the draw stack (0 = drawn first / underneath). */
    zIndex: number;
    symbol?: string;
    size?: number;
};

/** Criteria for {@link queryDrawingsToSnapshots} / {@link filterDrawingsWithMeta}. All set filters are AND-combined. */
export type DrawingQuery = {
    types?: ShapeType[];
    ids?: string[];
    idPrefix?: string;
    /** Any point must fall in the time window (unix seconds) when bounds are set. */
    timeMin?: number;
    timeMax?: number;
    /** Any point must fall in the price window when bounds are set. */
    priceMin?: number;
    priceMax?: number;
    /**
     * When true, every point must satisfy time/price bounds (when those bounds are set).
     * When false (default), at least one point must satisfy all active bounds.
     */
    strictBounds?: boolean;
    predicate?: (shape: IDrawingShape, zIndex: number) => boolean;
};

export type DrawingWithZIndex = {
    shape: IDrawingShape;
    zIndex: number;
};

function cloneForSnapshot<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export function shapeToSnapshot(shape: IDrawingShape, zIndex: number): DrawingSnapshot {
    const snap: DrawingSnapshot = {
        id: shape.id,
        type: shape.type,
        points: cloneForSnapshot(shape.points),
        style: cloneForSnapshot(shape.style),
        zIndex,
    };
    if (shape.type === ShapeType.CustomSymbol) {
        const cs = shape as CustomSymbolShape;
        snap.symbol = cs.symbol;
        snap.size = cs.size;
    }
    return snap;
}

function shapeMatchesBounds(shape: IDrawingShape, q: DrawingQuery): boolean {
    const pts = shape.points;
    if (!pts.length) return false;

    const inTime = (t: number) =>
        (q.timeMin == null || t >= q.timeMin) && (q.timeMax == null || t <= q.timeMax);
    const inPrice = (p: number) =>
        (q.priceMin == null || p >= q.priceMin) && (q.priceMax == null || p <= q.priceMax);
    const inBox = (pt: DrawingPoint) => inTime(pt.time) && inPrice(pt.price);

    const hasTime = q.timeMin != null || q.timeMax != null;
    const hasPrice = q.priceMin != null || q.priceMax != null;
    if (!hasTime && !hasPrice) return true;

    if (q.strictBounds) {
        return pts.every(inBox);
    }
    return pts.some(inBox);
}

/**
 * Returns drawings that match {@link DrawingQuery}, preserving stack order.
 */
export function filterDrawingsWithMeta(drawings: IDrawingShape[], query?: DrawingQuery): DrawingWithZIndex[] {
    const withZ = drawings.map((shape, zIndex) => ({shape, zIndex}));
    if (!query) {
        return withZ;
    }

    let list = withZ;

    if (query.types?.length) {
        const set = new Set(query.types);
        list = list.filter(({shape}) => set.has(shape.type));
    }
    if (query.ids?.length) {
        const set = new Set(query.ids);
        list = list.filter(({shape}) => set.has(shape.id));
    }
    if (query.idPrefix) {
        const p = query.idPrefix;
        list = list.filter(({shape}) => shape.id.startsWith(p));
    }
    if (query.timeMin != null || query.timeMax != null || query.priceMin != null || query.priceMax != null) {
        list = list.filter(({shape}) => shapeMatchesBounds(shape, query));
    }
    if (query.predicate) {
        const pred = query.predicate;
        list = list.filter(({shape, zIndex}) => pred(shape, zIndex));
    }

    return list;
}

export function queryDrawingsToSnapshots(drawings: IDrawingShape[], query?: DrawingQuery): DrawingSnapshot[] {
    return filterDrawingsWithMeta(drawings, query).map(({shape, zIndex}) => shapeToSnapshot(shape, zIndex));
}

/** Filtered live instances (same references as in chart state). Use for imperative updates after locating an id. */
export function filterDrawingInstances(drawings: IDrawingShape[], query?: DrawingQuery): IDrawingShape[] {
    return filterDrawingsWithMeta(drawings, query).map(({shape}) => shape);
}
