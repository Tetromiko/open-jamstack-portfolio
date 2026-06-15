import { validateOptionalMediaPath, validateRequiredString } from "../../../utils/schema";
import { photoCaptionDefaultState } from "./defaults";
import { PhotoCaptionEditor } from "./PhotoCaptionEditor";
import { PhotoCaptionView } from "./PhotoCaptionView";

const validFit = new Set(["cover", "contain", "fill", "none"]);
const validPosition = new Set(["center", "top", "bottom", "left", "right"]);
const validPlacement = new Set(["below", "top-left", "top-right", "bottom-left", "bottom-right"]);
const validFontSize = new Set(["sm", "md", "lg", "xl"]);
const validFontStyle = new Set(["normal", "italic", "bold"]);

export const photoCaptionFeature = {
  type: "media.photoCaption",
  category: "block",
  version: 1,
  title: "Фото з підписом",
  description: "Image block with configurable caption placement and typography.",
  defaultState: photoCaptionDefaultState,
  ViewComponent: PhotoCaptionView,
  EditorComponent: PhotoCaptionEditor,
  normalize(state) {
    return {
      ...photoCaptionDefaultState,
      ...state,
      image: {
        ...photoCaptionDefaultState.image,
        ...(state?.image || {}),
      },
      caption: {
        ...photoCaptionDefaultState.caption,
        ...(state?.caption || {}),
      },
    };
  },
  validate(state, path) {
    const errors = [
      validateOptionalMediaPath(state.image.src, `${path}.image.src`),
      state.image.alt ? "" : "",
      validFit.has(state.image.fit) ? "" : `${path}.image.fit має бути cover, contain, fill або none.`,
      validPosition.has(state.image.position) ? "" : `${path}.image.position має бути валідною позицією.`,
      validateRequiredString(state.caption.text, `${path}.caption.text`),
      validPlacement.has(state.caption.placement) ? "" : `${path}.caption.placement має бути валідним.`,
      validFontSize.has(state.caption.fontSize) ? "" : `${path}.caption.fontSize має бути валідним.`,
      validFontStyle.has(state.caption.fontStyle) ? "" : `${path}.caption.fontStyle має бути валідним.`,
      /^#[0-9a-f]{6}$/i.test(state.caption.color) ? "" : `${path}.caption.color має бути HEX кольором.`,
    ];

    return errors.filter(Boolean);
  },
};
