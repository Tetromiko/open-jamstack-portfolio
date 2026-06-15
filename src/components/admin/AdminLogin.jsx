import { useState } from "react";

export function AdminLogin({ onLogin, autoRepo, defaultBranch, status }) {
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState(autoRepo || "");
  const [branch, setBranch] = useState(defaultBranch);

  function handleSubmit(event) {
    event.preventDefault();
    onLogin({ token, repo, branch });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-bold text-stone-950">Підключення до GitHub</h2>
        <p className="text-sm leading-6 text-stone-600">
          Введіть Personal Access Token з правом Contents: read/write для цього репозиторію.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="GitHub PAT">
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="field font-mono"
            placeholder="github_pat_..."
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="Repository">
            <input
              type="text"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              className="field font-mono"
              placeholder="owner/repo"
              required
            />
          </Field>

          <Field label="Branch">
            <input
              type="text"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="field font-mono"
              required
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={status === "auth-checking"}
          className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "auth-checking" ? "Перевірка..." : "Підключитися"}
        </button>
      </form>
    </section>
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
