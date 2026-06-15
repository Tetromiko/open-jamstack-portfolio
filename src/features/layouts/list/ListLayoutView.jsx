import { getAnchorStyle } from "../sizing";

const gapClass = {
  none: "gap-0",
  sm: "gap-3",
  md: "gap-5",
  lg: "gap-8",
};

const paddingClass = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

const maxSizeValue = {
  sm: "18rem",
  md: "28rem",
  lg: "38rem",
  none: "none",
};

export function ListLayoutView({ state, children, surfaceProps = {} }) {
  const isHorizontal = state.orientation === "horizontal";
  const visibleChildren = Array.isArray(children) ? children.filter(Boolean) : children;
  const { className = "", style: surfaceStyle, ...restSurfaceProps } = surfaceProps;
  const shouldConstrainScroll = state.anchorY !== "stretch";
  const scrollStyle = state.scroll
    ? {
      maxHeight: isHorizontal || !shouldConstrainScroll ? undefined : maxSizeValue[state.maxSize],
      maxWidth: !isHorizontal || !shouldConstrainScroll ? undefined : maxSizeValue[state.maxSize],
      overflowX: isHorizontal ? "auto" : "hidden",
      overflowY: isHorizontal ? "hidden" : "auto",
    }
    : {};

  return (
    <section
      {...restSurfaceProps}
      className={[
        "block-card flex",
        isHorizontal ? "flex-row" : "flex-col",
        gapClass[state.gap],
        paddingClass[state.padding],
        className,
      ].join(" ")}
      style={{
        ...getAnchorStyle(state.anchorX, state.anchorY),
        ...scrollStyle,
        ...surfaceStyle,
      }}
    >
      {visibleChildren?.length ? (
        visibleChildren
      ) : (
        <div className="block-muted rounded-md border-dashed p-6 text-center text-sm">
          Empty list
        </div>
      )}
    </section>
  );
}
