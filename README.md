# README

## 1) Как открыть проект в VS Code

1. Откройте терминал в папке проекта.
2. Выполните:

```bash
code .
```

## 2) Как проверить, что git работает

```bash
git status
```

## 3) Как сделать первый коммит

1. Добавьте все файлы:

```bash
git add .
```

2. Сделайте коммит:

```bash
git commit -m "Initial version"
```

## 4) Как проверить Node

```bash
node -v
npm -v
```

## Local run

1. Запуск через `serve` (порт по умолчанию):

```bash
npx serve .
```

2. Запуск через Python на порту `8000`:

```bash
python3 -m http.server 8000
```

3. Полноценный secure-режим (frontend + private backend):

```bash
./start.command
```

## Stop server

`Ctrl+C`

## Leak protection

Pre-commit hook создаётся автоматически через script:

```bash
./scripts/precommit-check.sh --install-hook
```

Этот hook блокирует коммиты, если в staged есть:
- `private/` и `private-core/`
- `.env*` и `*.env`
- `*.key` и `*.pem`
- корневые `matrices.js` и `constraints.js`

## CI

Для `pull_request` и `push` в `main` запускается GitHub Actions workflow `CI`.
Он выполняет:
- leak scan по всему репозиторию (не только staged)
- smoke check структуры (`index.html`, sample core) и DEV/PROD loader строк в `index.html`

## Secure full-mode

- На `github.io` по умолчанию работает demo-режим (sample core).
- На любом другом хосте full secure-режим включается по умолчанию.
- Для принудительного переключения:
  - `?mode=secure` — full secure
  - `?mode=demo` — demo sample
- Дополнительно:
  - `backendOrigin` (если backend на другом домене/порту)
  - `coreKey` (если на backend задан `CORE_ACCESS_KEY`)

Примеры:

```text
http://localhost:5173/index.html
http://localhost:5173/index.html?mode=secure&backendOrigin=http://localhost:8787
http://localhost:5173/index.html?mode=secure&backendOrigin=http://localhost:8787&coreKey=change_me
http://localhost:5173/index.html?mode=demo
```

Backend переменные (`server/.env`):
- `FRONT_ORIGIN` (опционально, origin frontend для CORS)
- `CORE_ACCESS_KEY` (опционально, включает защиту `/core/*`)

## Full host deployment

- Backend теперь может отдавать UI сам:
  - `GET /` и `GET /index.html` -> `index.html`
  - `GET /sample/*` -> demo assets
  - `GET /refs/*` -> refs assets
- Для полнофункционального прод-хоста запускайте Node backend и открывайте его домен напрямую.
- Если задан `CORE_ACCESS_KEY`, передавайте `coreKey` в URL или через `localStorage`/JS-конфиг.

## Live demo

GitHub Pages: https://nosoroguspapuas-cloud.github.io/prompt-builder/ (placeholder)
