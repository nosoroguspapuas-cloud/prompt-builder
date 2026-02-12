#!/usr/bin/env bash
set -euo pipefail

install_hook() {
  local repo_root hook_path
  repo_root="$(git rev-parse --show-toplevel)"
  hook_path="$repo_root/.git/hooks/pre-commit"

  cat > "$hook_path" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
"$repo_root/scripts/precommit-check.sh"
HOOK

  chmod +x "$hook_path"
  echo "Installed pre-commit hook: $hook_path"
}

if [[ "${1:-}" == "--install-hook" ]]; then
  install_hook
  exit 0
fi

staged_files="$(git diff --cached --name-only)"

if [[ -z "$staged_files" ]]; then
  exit 0
fi

blocked_files=()

while IFS= read -r file; do
  case "$file" in
    .env.example|*/.env.example)
      continue
      ;;
  esac
  case "$file" in
    private/*)
      blocked_files+=("$file (private/ is protected)")
      ;;
    private-core/*)
      blocked_files+=("$file (private-core/ is protected)")
      ;;
    matrices.js|constraints.js)
      blocked_files+=("$file (root core file is protected)")
      ;;
    *.key|*.pem)
      blocked_files+=("$file (secret key material is protected)")
      ;;
    .env|.env.*|*.env|*/.env|*/.env.*|*/*.env)
      blocked_files+=("$file (.env files are protected)")
      ;;
  esac
done <<< "$staged_files"

if [[ ${#blocked_files[@]} -gt 0 ]]; then
  echo "ERROR: Commit blocked by leak protection."
  echo "The following staged files are not allowed in this public repository:"
  for item in "${blocked_files[@]}"; do
    echo "- $item"
  done
  echo "Please unstage/remove these files and commit again."
  exit 1
fi

exit 0
