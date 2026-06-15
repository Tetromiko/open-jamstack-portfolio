import { anchorXOptions, anchorYOptions } from "./sizing";

const anchorLabels = {
  left: "Left",
  center: "Center",
  right: "Right",
  stretch: "Stretch",
  top: "Top",
  middle: "Middle",
  bottom: "Bottom",
};

export function AnchorPresetField({ anchorX, anchorY, onChange }) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">Container anchors</span>
        <span className="font-mono text-[11px] text-stone-500">
          {anchorY}/{anchorX}
        </span>
      </div>

      <div className="grid grid-cols-[54px_repeat(4,44px)] gap-1.5">
        <span />
        {anchorXOptions.map((x) => (
          <span key={x} className="truncate text-center text-[10px] font-semibold text-stone-500">
            {anchorLabels[x]}
          </span>
        ))}

        {anchorYOptions.map((y) => (
          <Row
            key={y}
            y={y}
            selectedX={anchorX}
            selectedY={anchorY}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function Row({ y, selectedX, selectedY, onChange }) {
  return (
    <>
      <span className="flex items-center text-[10px] font-semibold text-stone-500">{anchorLabels[y]}</span>
      {anchorXOptions.map((x) => {
        const isSelected = x === selectedX && y === selectedY;
        return (
          <button
            key={`${y}-${x}`}
            type="button"
            onClick={() => onChange({ anchorX: x, anchorY: y })}
            className={[
              "relative h-9 rounded-md border bg-white transition hover:border-teal-500",
              isSelected ? "border-teal-500 ring-2 ring-teal-500/20" : "border-stone-300",
            ].join(" ")}
            title={`${anchorLabels[y]} ${anchorLabels[x]}`}
            aria-label={`${anchorLabels[y]} ${anchorLabels[x]}`}
          >
            <span className="absolute inset-1 rounded-sm border border-stone-300 bg-stone-100" />
            <span
              className="absolute rounded-sm border border-stone-700 bg-stone-200"
              style={getMiniRectStyle(x, y)}
            />
            {isSelected ? (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
            ) : null}
          </button>
        );
      })}
    </>
  );
}

function getMiniRectStyle(anchorX, anchorY) {
  const style = {
    width: "12px",
    height: "12px",
  };

  if (anchorX === "left") style.left = "10px";
  if (anchorX === "center") style.left = "calc(50% - 6px)";
  if (anchorX === "right") style.right = "10px";
  if (anchorX === "stretch") {
    style.left = "8px";
    style.right = "8px";
    style.width = "auto";
  }

  if (anchorY === "top") style.top = "8px";
  if (anchorY === "middle") style.top = "calc(50% - 6px)";
  if (anchorY === "bottom") style.bottom = "8px";
  if (anchorY === "stretch") {
    style.top = "7px";
    style.bottom = "7px";
    style.height = "auto";
  }

  return style;
}
