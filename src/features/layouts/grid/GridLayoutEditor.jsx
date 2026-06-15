import { AnchorPresetField } from "../AnchorPresetField";

const gapOptions = ["none", "sm", "md", "lg"];
const paddingOptions = ["none", "sm", "md", "lg"];
const alignOptions = ["start", "center", "end", "stretch"];

export function GridLayoutEditor({ state, onChange }) {
  function update(patch) {
    onChange({
      ...state,
      ...patch,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Rows">
        <input
          type="number"
          min="1"
          max="6"
          value={state.rows}
          onChange={(event) => update({
            rows: Number(event.target.value),
            rowFractions: resizeFractions(state.rowFractions, Number(event.target.value)),
          })}
          className="field"
        />
      </Field>

      <Field label="Columns">
        <input
          type="number"
          min="1"
          max="6"
          value={state.columns}
          onChange={(event) => update({
            columns: Number(event.target.value),
            columnFractions: resizeFractions(state.columnFractions, Number(event.target.value)),
          })}
          className="field"
        />
      </Field>

      <Field label="Row proportions">
        <input
          type="text"
          value={state.rowFractions}
          onChange={(event) => update({ rowFractions: event.target.value })}
          placeholder="1:1"
          className="field"
        />
      </Field>

      <Field label="Column proportions">
        <input
          type="text"
          value={state.columnFractions}
          onChange={(event) => update({ columnFractions: event.target.value })}
          placeholder="1:2:1"
          className="field"
        />
      </Field>

      <SelectField label="Gap" value={state.gap} options={gapOptions} onChange={(gap) => update({ gap })} />
      <SelectField label="Padding" value={state.padding} options={paddingOptions} onChange={(padding) => update({ padding })} />
      <SelectField label="Align items" value={state.align} options={alignOptions} onChange={(align) => update({ align })} />
      <AnchorPresetField anchorX={state.anchorX} anchorY={state.anchorY} onChange={update} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function resizeFractions(value, count) {
  const nextCount = Math.max(1, Math.min(6, Number.parseInt(count, 10) || 1));
  const parts = String(value || "1").split(":").filter(Boolean);
  while (parts.length < nextCount) parts.push("1");
  return parts.slice(0, nextCount).join(":");
}
