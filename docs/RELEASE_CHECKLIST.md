# Release Checklist (Dev -> Main)

1. Run local checks:
   - `npm run lint`
   - `npm run template:check`
2. Verify `.template-export/` contains no dev-only content.
3. Confirm `/admin` behavior:
   - localhost: no PAT required
   - github.io: PAT required
4. Confirm GitHub Pages save creates one commit for JSON-only edits.
5. Confirm GitHub Pages save creates one commit for JSON + staged media.
6. Confirm `.template-export/src/services/storage/localProvider.js` does not exist.
7. Confirm `public/portfolio-data.json` is schema-valid.
8. Merge to `dev` and let `build-template.yml` sync `main`.
