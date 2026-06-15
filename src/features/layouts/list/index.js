import { listLayoutDefaultState } from "./defaults";
import { ListLayoutEditor } from "./ListLayoutEditor";
import { ListLayoutView } from "./ListLayoutView";
import { normalizeAnchorX, normalizeAnchorY, validAnchorX, validAnchorY } from "../sizing";

const validOrientation = new Set(["vertical", "horizontal"]);
const validGap = new Set(["none", "sm", "md", "lg"]);
const validPadding = new Set(["none", "sm", "md", "lg"]);
const validMaxSize = new Set(["sm", "md", "lg", "none"]);

export const listLayoutFeature = {
  type: "layout.list",
  category: "layout",
  acceptsChildren: true,
  version: 1,
  title: "List",
  description: "Scrollable vertical or horizontal list container.",
  defaultState: listLayoutDefaultState,
  ViewComponent: ListLayoutView,
  EditorComponent: ListLayoutEditor,
  normalize(state) {
    const nextState = {
      ...listLayoutDefaultState,
      ...(state || {}),
    };

    return {
      orientation: validOrientation.has(nextState.orientation) ? nextState.orientation : listLayoutDefaultState.orientation,
      gap: validGap.has(nextState.gap) ? nextState.gap : listLayoutDefaultState.gap,
      padding: validPadding.has(nextState.padding) ? nextState.padding : listLayoutDefaultState.padding,
      maxSize: validMaxSize.has(nextState.maxSize) ? nextState.maxSize : listLayoutDefaultState.maxSize,
      scroll: Boolean(nextState.scroll),
      anchorX: normalizeAnchorX(nextState.anchorX, nextState.fillMode),
      anchorY: normalizeAnchorY(nextState.anchorY, nextState.fillMode),
    };
  },
  validate(state, path) {
    const errors = [
      validOrientation.has(state.orientation) ? "" : `${path}.orientation має бути vertical або horizontal.`,
      validGap.has(state.gap) ? "" : `${path}.gap має бути none, sm, md або lg.`,
      validPadding.has(state.padding) ? "" : `${path}.padding має бути none, sm, md або lg.`,
      validMaxSize.has(state.maxSize) ? "" : `${path}.maxSize має бути sm, md, lg або none.`,
      typeof state.scroll === "boolean" ? "" : `${path}.scroll має бути boolean.`,
      validAnchorX.has(state.anchorX) ? "" : `${path}.anchorX має бути left, center, right або stretch.`,
      validAnchorY.has(state.anchorY) ? "" : `${path}.anchorY має бути top, middle, bottom або stretch.`,
    ];

    return errors.filter(Boolean);
  },
};
