# Open Jamstack Portfolio

This repository is a template factory for a static portfolio with a browser-based admin.

## Branch model

- `dev` is the development factory.
- `main` is the clean template users create repositories from with **Use this template**.
- `main` is generated from `dev` by `.github/workflows/build-template.yml`.

## Architecture

- Content lives in `public/portfolio-data.json`.
- Features are block descriptors in `src/features`.
- The site model treats JSON as a page/block document rendered by a builder.
- Admin saves through a storage abstraction.
- Local dev uses Vite middleware and writes to the filesystem.
- Template runtime uses GitHub REST Git Data API and publishes JSON plus media in one commit.

See `docs/SITE_FUNCTIONALITY.md` for the feature/editor/view contract.

## Local development

```bash
npm install
npm run dev
```

Open `/admin` on localhost. No PAT is required in local dev mode.

## Template export

```bash
npm run template:check
```

The export is written to `.template-export/`. During export, dev-only storage middleware is removed and the storage provider is replaced with the GitHub-only provider.

## User setup from template

1. Click **Use this template**.
2. Create a repository, usually `username.github.io`.
3. Enable GitHub Pages for the repository.
4. Open `/admin`.
5. Enter a fine-grained PAT with `Contents: Read and write`.
6. Edit and publish.
