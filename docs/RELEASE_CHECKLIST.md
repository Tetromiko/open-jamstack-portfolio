# Release Checklist (Dev -> Main)

1. Run local checks:
   - `npm run lint`
   - `npm run template:check`
2. Verify `.template-export/` contains no dev-only content.
3. Confirm `/admin` behavior:
   - localhost: no PAT required
   - github.io: PAT required
4. Confirm `public/portfolio-data.json` is schema-valid.
5. Merge to `dev` and let `build-template.yml` sync `main`.
