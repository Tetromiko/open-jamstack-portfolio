const fitClass = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
};

const positionClass = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

const captionSizeClass = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

const captionStyleClass = {
  normal: "font-medium not-italic",
  italic: "font-medium italic",
  bold: "font-bold not-italic",
};

const overlayPlacementClass = {
  "top-left": "left-4 top-4",
  "top-right": "right-4 top-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

export function PhotoCaptionView({ state }) {
  const isOverlay = state.caption.placement !== "below";
  const hasImage = Boolean(state.image.src);

  return (
    <figure className="block-card overflow-hidden p-3">
      <div className="block-muted relative aspect-[4/3] overflow-hidden rounded-lg">
        {hasImage ? (
          <img
            src={state.image.src}
            alt={state.image.alt}
            className={`h-full w-full ${fitClass[state.image.fit]} ${positionClass[state.image.position]}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm">No image selected</div>
        )}

        {isOverlay && state.caption.text ? (
          <figcaption
            className={`absolute max-w-[80%] rounded-md bg-black/55 px-3 py-2 text-white shadow-sm ${overlayPlacementClass[state.caption.placement]} ${captionSizeClass[state.caption.fontSize]} ${captionStyleClass[state.caption.fontStyle]}`}
            style={{ color: state.caption.color }}
          >
            {state.caption.text}
          </figcaption>
        ) : null}
      </div>

      {!isOverlay && state.caption.text ? (
        <figcaption
          className={`px-1 pt-3 ${captionSizeClass[state.caption.fontSize]} ${captionStyleClass[state.caption.fontStyle]}`}
          style={{ color: state.caption.color }}
        >
          {state.caption.text}
        </figcaption>
      ) : null}
    </figure>
  );
}
