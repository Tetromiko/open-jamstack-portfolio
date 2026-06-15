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
      <Field label="Columns">
        <input
          type="number"
          min="1"
          max="4"
          value={state.columns}
          onChange={(event) => update({ columns: Number(event.target.value) })}
          className="field"
        />
      </Field>

      <SelectField label="Gap" value={state.gap} options={gapOptions} onChange={(gap) => update({ gap })} />
      <SelectField label="Padding" value={state.padding} options={paddingOptions} onChange={(padding) => update({ padding })} />
      <SelectField label="Align items" value={state.align} options={alignOptions} onChange={(align) => update({ align })} />

      <Field label="Background">
        <input
          type="color"
          value={state.background}
          onChange={(event) => update({ background: event.target.value })}
          className="h-10 w-full cursor-pointer rounded-md border border-stone-300 bg-white p-1"
        />
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
