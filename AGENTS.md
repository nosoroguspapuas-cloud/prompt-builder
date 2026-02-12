# AGENTS Contract

## 1) Repository Goal

This repository is a public Prompt Builder UI with sample core data.
It must remain safe for open access, demos, and collaboration.

## 2) Global Rules

- All changes go through Pull Requests (PR). Direct pushes to `main` are not allowed.
- Branch naming format: `codex/<role>/<issue>-<slug>` (preferred) or `agent/<role>/<issue>-<slug>` (legacy).
- Secrets and forbidden files are prohibited in this repository.
  - Any files under `private/`
  - Any files under `private-core/` (except tracked submodule pointer updates)
  - Any `.env`, `.env.*`, `*.env` (except `.env.example`)
  - Any `*.key`, `*.pem`
  - Root `matrices.js`
  - Root `constraints.js`
- CI is mandatory. PR can be merged only with green checks.
- If `private-core` submodule is updated, the pointer update must be shipped in a dedicated PR.

## 3) Agent Roles

### Frontend Agent

Responsibilities:
- `index.html`, visual/UI behavior, UX text, client-side interaction.
- Preserve app behavior and compatibility with sample core fallback.

Restrictions:
- Must not introduce or expose private core data.
- Must not bypass loader safety or CI checks.

### Core Agent

Responsibilities:
- Public sample core consistency (`sample/*`), schema compatibility, data integrity.
- Coordinate with private-core maintainers when interface contracts change.

Restrictions:
- Must not commit private core files into this repo.
- Must not modify secrets or env material.

### CI-Security Agent

Responsibilities:
- GitHub Actions workflows, leak scan, smoke checks, repo policy automation.
- Maintain CODEOWNERS/templates and guardrails.

Restrictions:
- Must not weaken leak checks without documented reason.
- Must not disable required checks for convenience.

### Release Agent

Responsibilities:
- PR flow orchestration, branch hygiene, merge readiness, changelog/release notes.
- Ensure submodule pointer bumps are isolated and traceable.

Restrictions:
- Must not merge red CI.
- Must not mix unrelated changes in one release PR.

## 4) Agent Workflow

1. Pick an issue.
2. Reproduce/validate the issue locally.
3. Implement the smallest safe fix.
4. Open PR using repository template and complete checklist:
   - CI green
   - Leak scan pass
   - Smoke check pass
   - No private-core data touched (unless explicit pointer-only PR)

## 5) Troubleshooting

### If CI fails

- Read failed job logs first (`Leak scan` / `Smoke check`).
- Fix root cause in branch and push follow-up commit.
- Re-run checks only after code/workflow fix is applied.

### If PR is blocked

- Check required checks and branch protection status.
- Ensure branch is up to date with `main`.
- Request required review/approval if configured.
- If blocked by policy mismatch, open a dedicated policy PR rather than bypassing rules.

## 6) Updating private-core pointer

Run:

```bash
./scripts/update-private-core-pointer.sh
```

Any `private-core` update must be delivered as a dedicated PR in this public repository that only updates the submodule pointer.
