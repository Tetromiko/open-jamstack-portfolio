import { gridLayoutDefaultState } from "./defaults";
import { GridLayoutEditor } from "./GridLayoutEditor";
import { GridLayoutView } from "./GridLayoutView";
import { normalizeAnchorX, normalizeAnchorY, validAnchorX, validAnchorY } from "../sizing";

const validGap = new Set(["none", "sm", "md", "lg"]);
const validPadding = new Set(["none", "sm", "md", "lg"]);
const validAlign = new Set(["start", "center", "end", "stretch"]);

export const gridLayoutFeature = {
  type: "layout.grid",
  category: "layout",
  acceptsChildren: true,
  version: 1,
  title: "Fixed grid",
  description: "Fixed-capacity grid with configurable row and column proportions.",
  defaultState: gridLayoutDefaultState,
  ViewComponent: GridLayoutView,
  EditorComponent: GridLayoutEditor,
  normalize(state) {
    const nextState = {
      ...gridLayoutDefaultState,
      ...(state || {}),
    };

    const rows = clampInteger(nextState.rows, 1, 6);
    const columns = clampInteger(nextState.columns, 1, 6);

    return {
      rows,
      columns,
      rowFractions: normalizeFractions(nextState.rowFractions, rows),
      columnFractions: normalizeFractions(nextState.columnFractions, columns),
      gap: validGap.has(nextState.gap) ? nextState.gap : gridLayoutDefaultState.gap,
      padding: validPadding.has(nextState.padding) ? nextState.padding : gridLayoutDefaultState.padding,
      align: validAlign.has(nextState.align) ? nextState.align : gridLayoutDefaultState.align,
      anchorX: normalizeAnchorX(nextState.anchorX, nextState.fillMode),
      anchorY: normalizeAnchorY(nextState.anchorY, nextState.fillMode),
    };
  },
  validate(state, path) {
    const errors = [
      Number.isInteger(state.rows) && state.rows >= 1 && state.rows <= 6
        ? ""
        : `${path}.rows має бути числом від 1 до 6.`,
      Number.isInteger(state.columns) && state.columns >= 1 && state.columns <= 6
        ? ""
        : `${path}.columns має бути числом від 1 до 6.`,
      validateFractions(state.rowFractions, state.rows, `${path}.rowFractions`),
      validateFractions(state.columnFractions, state.columns, `${path}.columnFractions`),
      validGap.has(state.gap) ? "" : `${path}.gap має бути none, sm, md або lg.`,
      validPadding.has(state.padding) ? "" : `${path}.padding має бути none, sm, md або lg.`,
      validAlign.has(state.align) ? "" : `${path}.align має бути start, center, end або stretch.`,
      validAnchorX.has(state.anchorX) ? "" : `${path}.anchorX має бути left, center, right або stretch.`,
      validAnchorY.has(state.anchorY) ? "" : `${path}.anchorY має бути top, middle, bottom або stretch.`,
    ];

    return errors.filter(Boolean);
  },
};

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function normalizeFractions(value, count) {
  const numbers = String(value || "")
    .split(":")
    .map((item) => Number.parseFloat(item))
    .filter((item) => Number.isFinite(item) && item > 0);
  const nextNumbers = numbers.slice(0, count);
  while (nextNumbers.length < count) nextNumbers.push(1);
  return nextNumbers.join(":");
}

function validateFractions(value, count, path) {
  const parts = String(value || "").split(":");
  const isValid =
    parts.length === count &&
    parts.every((part) => {
      const number = Number.parseFloat(part);
      return Number.isFinite(number) && number > 0;
    });

  return isValid ? "" : `${path} має містити ${count} пропорцій у форматі 1:2:1.`;
}
