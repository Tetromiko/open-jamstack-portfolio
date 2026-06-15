import { useState } from "react";

const fitOptions = ["cover", "contain", "fill", "none"];
const positionOptions = ["center", "top", "bottom", "left", "right"];
const placementOptions = ["below", "top-left", "top-right", "bottom-left", "bottom-right"];
const fontSizeOptions = ["sm", "md", "lg", "xl"];
const fontStyleOptions = ["normal", "italic", "bold"];

export function PhotoCaptionEditor({ state, onChange, stageAsset, pendingAssets }) {
  const [localPreviewSrc, setLocalPreviewSrc] = useState("");
  const pendingImage = pendingAssets.find((asset) => asset.publicPath === state.image.src);
  const previewSrc = pendingImage?.previewUrl || localPreviewSrc || state.image.src;

  async function handleImageFile(file) {
    const asset = await stageAsset(file);
    if (!asset) return;
    setLocalPreviewSrc(asset.previewUrl);
    onChange({
      ...state,
      image: {
        ...state.image,
        src: asset.publicPath,
      },
    });
  }

  function updateImage(patch) {
    if (Object.hasOwn(patch, "src") && patch.src !== state.image.src) {
      const matchingPendingAsset = pendingAssets.find((asset) => asset.publicPath === patch.src);
      setLocalPreviewSrc(matchingPendingAsset?.previewUrl || "");
    }

    onChange({
      ...state,
      image: {
        ...state.image,
        ...patch,
      },
    });
  }

  function updateCaption(patch) {
    onChange({
      ...state,
      caption: {
        ...state.caption,
        ...patch,
      },
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <div className="space-y-3">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-stone-300 bg-stone-100 text-xs text-stone-500">
          {previewSrc ? <img src={previewSrc} alt="" className="h-full w-full object-cover" /> : "No image"}
        </div>

        <label className="inline-flex cursor-pointer items-center rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700">
          Choose image
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleImageFile(event.target.files?.[0])}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-4">
        <Field label="Image path">
          <input
            type="text"
            value={state.image.src}
            onChange={(event) => updateImage({ src: event.target.value })}
            className="field font-mono text-xs"
            placeholder="/uploads/photo.jpg"
          />
        </Field>

        <Field label="Alt text">
          <input
            type="text"
            value={state.image.alt}
            onChange={(event) => updateImage({ alt: event.target.value })}
            className="field"
            placeholder="Short image description"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Fill mode" value={state.image.fit} options={fitOptions} onChange={(fit) => updateImage({ fit })} />
          <SelectField label="Image position" value={state.image.position} options={positionOptions} onChange={(position) => updateImage({ position })} />
        </div>

        <Field label="Caption">
          <textarea
            value={state.caption.text}
            onChange={(event) => updateCaption({ text: event.target.value })}
            className="field min-h-24 resize-y"
            placeholder="Caption text"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Caption placement" value={state.caption.placement} options={placementOptions} onChange={(placement) => updateCaption({ placement })} />
          <SelectField label="Font size" value={state.caption.fontSize} options={fontSizeOptions} onChange={(fontSize) => updateCaption({ fontSize })} />
          <SelectField label="Font style" value={state.caption.fontStyle} options={fontStyleOptions} onChange={(fontStyle) => updateCaption({ fontStyle })} />
          <Field label="Text color">
            <input
              type="color"
              value={state.caption.color}
              onChange={(event) => updateCaption({ color: event.target.value })}
              className="h-10 w-full cursor-pointer rounded-md border border-stone-300 bg-white p-1"
            />
          </Field>
        </div>
      </div>
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
