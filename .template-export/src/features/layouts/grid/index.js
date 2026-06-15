import { gridLayoutDefaultState } from "./defaults";
import { GridLayoutEditor } from "./GridLayoutEditor";
import { GridLayoutView } from "./GridLayoutView";

const validGap = new Set(["none", "sm", "md", "lg"]);
const validPadding = new Set(["none", "sm", "md", "lg"]);
const validAlign = new Set(["start", "center", "end", "stretch"]);

export const gridLayoutFeature = {
  type: "layout.grid",
  category: "layout",
  acceptsChildren: true,
  version: 1,
  title: "Grid layout",
  description: "Container layout for arranging nested layouts and blocks.",
  defaultState: gridLayoutDefaultState,
  ViewComponent: GridLayoutView,
  EditorComponent: GridLayoutEditor,
  normalize(state) {
    const nextState = {
      ...gridLayoutDefaultState,
      ...(state || {}),
    };

    return {
      ...nextState,
      columns: clampInteger(nextState.columns, 1, 4),
    };
  },
  validate(state, path) {
    const errors = [
      Number.isInteger(state.columns) && state.columns >= 1 && state.columns <= 4
        ? ""
        : `${path}.columns має бути числом від 1 до 4.`,
      validGap.has(state.gap) ? "" : `${path}.gap має бути none, sm, md або lg.`,
      validPadding.has(state.padding) ? "" : `${path}.padding має бути none, sm, md або lg.`,
      validAlign.has(state.align) ? "" : `${path}.align має бути start, center, end або stretch.`,
      /^#[0-9a-f]{6}$/i.test(state.background) ? "" : `${path}.background має бути HEX кольором.`,
    ];

    return errors.filter(Boolean);
  },
};

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}
