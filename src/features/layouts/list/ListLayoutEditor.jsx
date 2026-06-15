import { AnchorPresetField } from "../AnchorPresetField";

const orientationOptions = ["vertical", "horizontal"];
const gapOptions = ["none", "sm", "md", "lg"];
const paddingOptions = ["none", "sm", "md", "lg"];
const maxSizeOptions = ["sm", "md", "lg", "none"];

export function ListLayoutEditor({ state, onChange }) {
  function update(patch) {
    onChange({
      ...state,
      ...patch,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <SelectField
        label="Orientation"
        value={state.orientation}
        options={orientationOptions}
        onChange={(orientation) => update({ orientation })}
      />
      <SelectField label="Gap" value={state.gap} options={gapOptions} onChange={(gap) => update({ gap })} />
      <SelectField label="Padding" value={state.padding} options={paddingOptions} onChange={(padding) => update({ padding })} />
      <SelectField label="Max size" value={state.maxSize} options={maxSizeOptions} onChange={(maxSize) => update({ maxSize })} />
      <AnchorPresetField anchorX={state.anchorX} anchorY={state.anchorY} onChange={update} />

      <Field label="Scroll">
        <label className="flex h-10 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={state.scroll}
            onChange={(event) => update({ scroll: event.target.checked })}
            className="h-4 w-4 accent-teal-600"
          />
          Enable overflow
        </label>
      </Field>
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
