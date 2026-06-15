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

const alignClass = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export function GridLayoutView({ state, children, surfaceProps = {} }) {
  const visibleChildren = Array.isArray(children) ? children.filter(Boolean) : children;
  const { className = "", style: surfaceStyle, ...restSurfaceProps } = surfaceProps;

  return (
    <section
      {...restSurfaceProps}
      className={[
        "block-card grid",
        gapClass[state.gap],
        paddingClass[state.padding],
        alignClass[state.align],
        className,
      ].join(" ")}
      style={{
        ...getAnchorStyle(state.anchorX, state.anchorY),
        gridTemplateColumns: toGridTrack(state.columnFractions),
        gridTemplateRows: toGridTrack(state.rowFractions),
        ...surfaceStyle,
      }}
    >
      {visibleChildren?.length ? (
        visibleChildren
      ) : (
        <div className="block-muted col-span-full rounded-md border-dashed p-6 text-center text-sm">
          Empty layout
        </div>
      )}
    </section>
  );
}

function toGridTrack(fractions) {
  return String(fractions || "1")
    .split(":")
    .map((fraction) => `${Math.max(0.1, Number.parseFloat(fraction) || 1)}fr`)
    .join(" ");
}
