# Project Requirements

## Core goals

1. Keep development and production-template responsibilities separated.
2. Keep portfolio data in JSON files stored in repository.
3. Support serverless admin editing through GitHub PAT in Pages mode.

## Functional requirements

1. Public route renders `portfolio-data.json`.
2. `/admin` supports login/logout lifecycle.
3. In `github-pages` mode, saving uses GitHub contents API (`GET sha` then `PUT content+sha`).
4. In `self-host` mode, saving updates local state/localStorage for fast iteration.

## Branch and release requirements

1. `dev` branch is for feature work.
2. `main` branch is for clean template only.
3. `main` is updated automatically via CI from `dev`.

## Security requirements

1. PAT must never be committed.
2. PAT is stored only in localStorage.
3. Access checks must run before allowing save in Pages mode.

## Data requirements

1. `schemaVersion` is mandatory.
2. `profile` and `contacts` objects are mandatory.
3. Required string fields:
   - `profile.name`
   - `profile.title`
   - `profile.location`
   - `profile.summary`
   - `contacts.email`
   - `contacts.linkedin`
