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

export function GridLayoutView({ state, children }) {
  return (
    <section
      className={`block-card grid ${gapClass[state.gap]} ${paddingClass[state.padding]} ${alignClass[state.align]}`}
      style={{
        backgroundColor: state.background,
        gridTemplateColumns: `repeat(${state.columns}, minmax(0, 1fr))`,
      }}
    >
      {children?.length ? (
        children
      ) : (
        <div className="block-muted col-span-full rounded-md border-dashed p-6 text-center text-sm">
          Empty layout
        </div>
      )}
    </section>
  );
}
