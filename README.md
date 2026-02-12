# Prompt Builder

Public Prompt Builder UI with sample core fallback.

## Requirements

- Node.js + npm
- Python 3 (используется в `start.command` для локального статического сервера)

Node version:

```bash
nvm use
```

## Install

```bash
npm --prefix server ci
npm --prefix frontend ci
```

## Run locally

### Secure full mode (recommended)

```bash
./start.command
```

Остановка:

```bash
./stop.command
```

### Backend only

```bash
npm run dev
```

### Frontend static only

```bash
npm run frontend:serve
```

## Checks

```bash
npm run check
```

Что проверяется:
- синтаксис backend (`node --check`)
- регрессионные проверки в `test.js`

## Leak protection

Проверка staged-файлов:

```bash
./scripts/precommit-check.sh
```

Установка pre-commit hook:

```bash
npm run hook:install
```

Hook блокирует коммит, если в staged есть:
- `private/` и `private-core/`
- `.env*` и `*.env` (кроме `.env.example`)
- `*.key` и `*.pem`
- корневые `matrices.js` и `constraints.js`

## CI

Workflow `CI` для `pull_request` и `push` в `main` выполняет:
- leak scan по репозиторию
- установку backend-зависимостей
- backend syntax check + `test.js`
- smoke check структуры и loader-маркеров в `index.html`

## Secure mode query params

- `mode=secure` - full secure
- `mode=demo` - sample/demo mode
- `backendOrigin` - backend origin (если backend не на том же host)
- `coreKey` - ключ доступа, если на backend задан `CORE_ACCESS_KEY`

Примеры:

```text
http://localhost:5173/index.html
http://localhost:5173/index.html?mode=secure&backendOrigin=http://localhost:8787
http://localhost:5173/index.html?mode=secure&backendOrigin=http://localhost:8787&coreKey=change_me
http://localhost:5173/index.html?mode=demo
```
