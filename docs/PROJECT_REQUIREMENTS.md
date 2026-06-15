# Project Requirements

## Core goals

1. Treat the repository as a template generator.
2. Keep `dev` as the development branch and `main` as the clean user template.
3. Keep every feature as a block descriptor with public UI, admin UI, defaults, and validation.
4. Keep storage behind a provider abstraction.
5. Treat `public/portfolio-data.json` as the site document that drives page layout and block state.
6. Support a Technical Artist / Unity developer portfolio with in-progress work, video embeds, and 3D model presentation.
7. Stay autonomous: no likes, reactions, comments, or server-dependent social features.

## Site builder requirements

1. Every feature must expose a view component and an editor component.
2. View components receive serialized state and render public UI.
3. Editor components collect all state required by the matching view component.
4. Editor components must not publish directly to storage.
5. A builder service must read the site document, resolve feature descriptors, and render pages.
6. Unknown feature types must use a controlled fallback instead of crashing the public site.
7. Feature state must be JSON-serializable.
8. Feature descriptors must define defaults, validation, and optional migrations.
9. Feature descriptors must declare `category: "layout" | "block"`.
10. Layout features may declare `acceptsChildren: true` and render nested layouts or blocks.
11. Content block features must not own layout `children[]`; nested data like socials belongs inside block state.
12. `/admin` must render the same view components as the public site.
13. `/admin` must use a top action bar for save/session/status actions.
14. `/admin` must expose a categorized side library of available layouts and blocks.
15. Side library entries should be represented as skeleton previews, not full rendered components.
16. Admin users must be able to drag library items onto the page canvas.
17. Admin users must be able to drag existing blocks/layouts to reorder or move them into layouts.
18. Admin-only editing controls must appear as an overlay on top of blocks.
19. Opening block settings must show an editor modal over the live preview.

## Runtime requirements

1. Public route renders `public/portfolio-data.json`.
2. `/admin` supports login/logout lifecycle.
3. Local dev mode saves through Vite middleware.
4. Template mode saves through GitHub REST Git Data API.
5. Admin code sends one semantic change set regardless of storage backend.

## Atomic publish requirements

1. JSON and media must be published in one visible commit.
2. GitHub save must use Blobs -> Trees -> Commits -> Ref update.
3. Ref update must use `force: false`.
4. If blob, tree, commit, or ref update fails, the UI must report the failure.
5. If ref update returns conflict, the user must reload current data and retry.
6. Before every publish attempt, the validated site document must be backed up to `localStorage` under `portfolio_data_draft`.

## Content requirements

1. Video blocks must use external links only, such as YouTube or Vimeo.
2. 3D model blocks must support `.glb` assets stored in the repository.
3. `.glb` assets must be Draco-compressed before publishing.
4. Client-side media processing should reduce image/video-adjacent asset weight before upload where possible.
5. Future project blocks should support an `In Progress` state for work-in-progress presentation.
6. The visual design should stay clean, functional, and close to Figma-style UI.
7. Site theme must be stored in `site.theme` and applied to public and admin routes.
8. View components should render as distinct theme-aware blocks.
9. Admin must support scanning `public/uploads` and staging unused media files for deletion.

## Template generation requirements

1. `npm run template:check` builds the app and generates `.template-export`.
2. Template export removes dev-only local storage provider and middleware.
3. Template export replaces Vite config with a clean GitHub Pages-ready config.
4. Template export writes neutral starter portfolio data.
5. `main` is updated from generated export, not edited manually.

## Security requirements

1. PAT must never be committed.
2. PAT is stored only in browser localStorage.
3. PAT must never be logged, placed in URLs, or written to content files.
4. Fine-grained PAT should be scoped to one repository with `Contents: Read and write`.

## Data requirements

1. `schemaVersion` is mandatory.
2. The document model uses `pages[].blocks[]`.
3. Each block must include `id`, `type`, `version`, and `state`.
4. Layout blocks may include recursive `children[]`.
5. Non-layout blocks must not include `children[]`.
6. The starter template must include one `author.info` block.
7. The registry must include `layout.grid`, `author.info`, and `media.photoCaption`.
8. Required author strings:
   - `author.info.state.name`
   - `author.info.state.title`

## Reference docs

1. Detailed architecture: `docs/PROJECT_DOCUMENT.md`.
2. Site functionality and feature contract: `docs/SITE_FUNCTIONALITY.md`.
