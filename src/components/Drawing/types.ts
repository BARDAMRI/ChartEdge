import {Mode} from "../../contexts/ModeContext.tsx";

export type Drawing = {
    mode: Mode;
    args: any; // ניתן להחליף ב-type מדויק יותר אם יש
}