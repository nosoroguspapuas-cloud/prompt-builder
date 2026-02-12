#!/usr/bin/env bash
set -euo pipefail

if [[ ! -d .git ]]; then
  echo "Error: run this script from the repository root (missing .git directory)." >&2
  exit 1
fi

if [[ ! -d private-core ]]; then
  echo "Error: run this script from the repository root (missing private-core/)." >&2
  exit 1
fi

repo="nosoroguspapuas-cloud/prompt-builder"

git fetch origin
git checkout main
git pull origin main
git submodule update --init --recursive

(
  cd private-core
  git fetch origin
  git checkout main
  git pull origin main
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
git push -u origin "${branch}"

pr_url="$(gh pr create \
  --repo "${repo}" \
  --base main \
  --head "${branch}" \
  --title "Update private-core submodule" \
  --body "Updates submodule pointer to latest private-core main.")"

pr_number="$(gh pr view "${pr_url}" --repo "${repo}" --json number --jq '.number')"
gh pr merge "${pr_number}" --merge --delete-branch --auto --repo "${repo}"

echo "${pr_url}"
