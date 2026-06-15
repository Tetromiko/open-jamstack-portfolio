import { useState } from "react";
import { emptySocial } from "./defaults";

const displayOptions = [
  { value: "tags", label: "Tags" },
  { value: "icons", label: "Icons only" },
  { value: "icons-labels", label: "Icon + name" },
];

export function AuthorInfoEditor({ state, onChange, stageAsset, pendingAssets }) {
  const [socialDraft, setSocialDraft] = useState(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState("");
  const pendingAvatar = pendingAssets.find((asset) => asset.publicPath === state.avatar);
  const avatarPreview = pendingAvatar?.previewUrl || localAvatarPreview || state.avatar;

  async function handleAvatarFile(file) {
    const asset = await stageAsset(file);
    if (!asset) return;
    setLocalAvatarPreview(asset.previewUrl);
    onChange({
      ...state,
      avatar: asset.publicPath,
    });
  }

  async function handleSocialIconFile(file) {
    if (!socialDraft) return;
    const asset = await stageAsset(file);
    if (!asset) return;
    setSocialDraft({ ...socialDraft, icon: asset.publicPath });
  }

  function update(patch) {
    if (Object.hasOwn(patch, "avatar") && patch.avatar !== state.avatar) {
      const matchingPendingAsset = pendingAssets.find((asset) => asset.publicPath === patch.avatar);
      setLocalAvatarPreview(matchingPendingAsset?.previewUrl || "");
    }

    onChange({
      ...state,
      ...patch,
    });
  }

  function openNewSocial() {
    setSocialDraft({
      ...emptySocial,
      id: crypto.randomUUID(),
    });
  }

  function openEditSocial(social) {
    setSocialDraft({ ...social });
  }

  function saveSocial() {
    const normalized = {
      ...socialDraft,
      name: socialDraft.name.trim(),
      url: socialDraft.url.trim(),
      icon: socialDraft.icon.trim(),
    };

    const exists = state.socials.some((social) => social.id === normalized.id);
    update({
      socials: exists
        ? state.socials.map((social) => (social.id === normalized.id ? normalized : social))
        : [...state.socials, normalized],
    });
    setSocialDraft(null);
  }

  function removeSocial(id) {
    update({
      socials: state.socials.filter((social) => social.id !== id),
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[160px_1fr]">
        <div className="space-y-3">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-stone-300 bg-stone-100 text-xs text-stone-500">
            {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : "No avatar"}
          </div>

          <label className="inline-flex cursor-pointer items-center rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700">
            Choose avatar
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleAvatarFile(event.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-4">
          <Field label="Avatar path">
            <input
              type="text"
              value={state.avatar}
              onChange={(event) => update({ avatar: event.target.value })}
              className="field font-mono text-xs"
              placeholder="/uploads/avatar.png"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                type="text"
                value={state.name}
                onChange={(event) => update({ name: event.target.value })}
                className="field"
                placeholder="Your Name"
              />
            </Field>

            <Field label="Role">
              <input
                type="text"
                value={state.title}
                onChange={(event) => update({ title: event.target.value })}
                className="field"
                placeholder="Creative Technologist"
              />
            </Field>
          </div>

          <Field label="Location optional">
            <input
              type="text"
              value={state.location}
              onChange={(event) => update({ location: event.target.value })}
              className="field"
              placeholder="City, Country"
            />
          </Field>

          <Field label="Social display">
            <select
              value={state.socialDisplay}
              onChange={(event) => update({ socialDisplay: event.target.value })}
              className="field"
            >
              {displayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-stone-950">Socials</h3>
          <button
            type="button"
            onClick={openNewSocial}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-bold text-stone-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700"
            aria-label="Add social"
            title="Add social"
          >
            +
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.socials.map((social) => (
            <div key={social.id} className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm">
              <SocialIcon icon={social.icon} name={social.name} />
              <span className="font-semibold text-stone-800">{social.name}</span>
              <button type="button" onClick={() => openEditSocial(social)} className="text-xs font-semibold text-teal-700">
                Edit
              </button>
              <button type="button" onClick={() => removeSocial(social.id)} className="text-xs font-semibold text-red-600">
                Delete
              </button>
            </div>
          ))}

          {state.socials.length === 0 ? (
            <p className="text-sm text-stone-500">Натисніть +, щоб додати соціальну мережу.</p>
          ) : null}
        </div>
      </section>

      {socialDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <section className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-bold text-stone-950">Social item</h3>
              <button type="button" onClick={() => setSocialDraft(null)} className="text-sm font-bold text-stone-500">
                Close
              </button>
            </div>

            <Field label="Icon text, URL, or uploaded image">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={socialDraft.icon}
                  onChange={(event) => setSocialDraft({ ...socialDraft, icon: event.target.value })}
                  className="field"
                  placeholder="GH, ✦, /uploads/icon.svg"
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleSocialIconFile(event.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </Field>

            <Field label="Network name">
              <input
                type="text"
                value={socialDraft.name}
                onChange={(event) => setSocialDraft({ ...socialDraft, name: event.target.value })}
                className="field"
                placeholder="LinkedIn"
              />
            </Field>

            <Field label="Profile URL">
              <input
                type="text"
                value={socialDraft.url}
                onChange={(event) => setSocialDraft({ ...socialDraft, url: event.target.value })}
                className="field"
                placeholder="https://example.com/profile"
              />
            </Field>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSocialDraft(null)}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSocial}
                disabled={!socialDraft.name.trim() || !socialDraft.url.trim()}
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Add
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function SocialIcon({ icon, name }) {
  const isImage = icon.startsWith("/") || icon.startsWith("http://") || icon.startsWith("https://");
  if (isImage) {
    return <img src={icon} alt="" className="h-4 w-4 rounded-sm object-contain" />;
  }

  return <span aria-hidden="true">{icon || name.slice(0, 1)}</span>;
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">{label}</span>
      {children}
    </label>
  );
}
