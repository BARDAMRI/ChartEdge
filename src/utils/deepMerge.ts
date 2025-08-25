// utils/deepMerge.ts
import type {DeepPartial, DeepRequired} from "../types/types";

export function deepMerge<T>(
    base: DeepRequired<T>,
    patch?: DeepPartial<T>
): DeepRequired<T> {
    if (!patch) return base;

    const out: any = Array.isArray(base) ? [...(base as any)] : {...(base as any)};

    for (const key in patch) {
        const v = (patch as any)[key];
        if (v === undefined) continue;

        const bv = (base as any)[key];

        if (
            v &&
            typeof v === "object" &&
            !Array.isArray(v) &&
            bv &&
            typeof bv === "object" &&
            !Array.isArray(bv)
        ) {
            out[key] = deepMerge(bv, v);
        } else {
            out[key] = v;
        }
    }

    return out as DeepRequired<T>;
}