const displayClass = {
  tags: "rounded-full px-3 py-1.5 text-sm font-semibold",
  icons: "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
  "icons-labels": "rounded-full px-3 py-1.5 text-sm font-semibold",
};

export function AuthorInfoView({ state }) {
  return (
    <section className="block-card flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:items-start sm:p-7 sm:text-left">
      <div className="block-muted flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs">
        {state.avatar ? <img src={state.avatar} alt={state.name} className="h-full w-full object-cover" /> : "No avatar"}
      </div>

      <div className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-normal md:text-4xl">{state.name}</h1>
          <p className="text-base font-semibold" style={{ color: "var(--accent-text)" }}>{state.title}</p>
          {state.location ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>{state.location}</p> : null}
        </div>

        {state.socials.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {state.socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target={social.url.startsWith("mailto:") ? undefined : "_blank"}
                rel={social.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className={`inline-flex items-center gap-2 border transition hover:-translate-y-0.5 ${displayClass[state.socialDisplay]}`}
                style={{
                  background: "var(--surface-muted)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                title={social.name}
                aria-label={social.name}
              >
                <SocialIcon icon={social.icon} name={social.name} />
                {state.socialDisplay !== "icons" ? <span>{social.name}</span> : null}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SocialIcon({ icon, name }) {
  const isImage = icon.startsWith("/") || icon.startsWith("http://") || icon.startsWith("https://");
  if (isImage) {
    return <img src={icon} alt="" className="h-4 w-4 rounded-sm object-contain" />;
  }

  return <span aria-hidden="true">{icon || name.slice(0, 1)}</span>;
}
