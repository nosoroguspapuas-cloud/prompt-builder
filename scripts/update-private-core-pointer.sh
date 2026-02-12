#!/usr/bin/env bash
set -euo pipefail

dry_run=0
auto_merge=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      ;;
    --auto-merge)
      auto_merge=1
      ;;
    -h|--help)
      echo "Usage: ./scripts/update-private-core-pointer.sh [--dry-run] [--auto-merge]"
      exit 0
      ;;
    *)
      echo "Error: unknown option '$1'" >&2
      echo "Use --help for usage." >&2
      exit 1
      ;;
  esac
  shift
done

if [[ ! -d .git ]]; then
  echo "Error: run this script from the repository root (missing .git directory)." >&2
  exit 1
fi

if [[ ! -d private-core ]]; then
  echo "Error: run this script from the repository root (missing private-core/)." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is not clean. Commit/stash changes before running this script." >&2
  exit 1
fi

repo="nosoroguspapuas-cloud/prompt-builder"

git fetch origin
git checkout main
git pull --ff-only origin main
git submodule update --init --recursive

(
  cd private-core
  git fetch origin
  git checkout main
  git pull --ff-only origin main
)

if git diff --quiet -- private-core; then
  echo "Error: no private-core gitlink changes detected after update." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M)"
branch="agent/release/update-private-core-${timestamp}"

git checkout -b "${branch}"
git add private-core
git commit -m "Update private-core submodule"

if [[ "$dry_run" -eq 1 ]]; then
  echo "Dry run: created branch '${branch}' with updated submodule pointer. PR/merge were skipped."
  exit 0
fi

git push -u origin "${branch}"

pr_url="$(gh pr create \
  --repo "${repo}" \
  --base main \
  --head "${branch}" \
  --title "Update private-core submodule" \
  --body "Updates submodule pointer to latest private-core main.")"

if [[ "$auto_merge" -eq 1 ]]; then
  pr_number="$(gh pr view "${pr_url}" --repo "${repo}" --json number --jq '.number')"
  gh pr merge "${pr_number}" --merge --delete-branch --auto --repo "${repo}"
else
  echo "Auto-merge disabled. Review and merge PR manually, or rerun with --auto-merge."
fi

echo "${pr_url}"
