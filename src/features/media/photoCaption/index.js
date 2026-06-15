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
    const nextImage = {
      ...photoCaptionDefaultState.image,
      ...(state?.image || {}),
    };
    const nextCaption = {
      ...photoCaptionDefaultState.caption,
      ...(state?.caption || {}),
    };

    return {
      image: {
        src: nextImage.src,
        alt: nextImage.alt,
        fit: validFit.has(nextImage.fit) ? nextImage.fit : photoCaptionDefaultState.image.fit,
        position: validPosition.has(nextImage.position) ? nextImage.position : photoCaptionDefaultState.image.position,
      },
      caption: {
        text: nextCaption.text,
        placement: validPlacement.has(nextCaption.placement) ? nextCaption.placement : photoCaptionDefaultState.caption.placement,
        fontSize: validFontSize.has(nextCaption.fontSize) ? nextCaption.fontSize : photoCaptionDefaultState.caption.fontSize,
        fontStyle: validFontStyle.has(nextCaption.fontStyle) ? nextCaption.fontStyle : photoCaptionDefaultState.caption.fontStyle,
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
    ];

    return errors.filter(Boolean);
  },
};
