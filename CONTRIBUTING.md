# Contributing Guide

1. Create feature branches from `dev`.
2. Keep dev-only tools/content out of production template paths when possible.
3. Before PR to `dev`, run:
   - `npm run lint`
   - `npm run template:check`
4. Do not commit PAT or personal secrets.
5. Do not push directly to `main`; it is CI-synced.
