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

3. Рекомендуемый secure-режим (frontend + private backend):

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
- `sample/matrices.sample.js` и `sample/constraints.sample.js`

## CI

Для `pull_request` и `push` в `main` запускается GitHub Actions workflow `CI`.
Он выполняет:
- leak scan по всему репозиторию (не только staged)
- smoke check secure-структуры (`index.html`, `server/server.js`) и loader на `/core/*.js`

## Security mode

- Публичные sample-матрицы удалены из репозитория.
- `index.html` загружает core только с private backend:
  - `/core/matrices.js`
  - `/core/constraints.js`
- По умолчанию для localhost используется `http://localhost:8787`.
- Для ручного переопределения backend можно открыть:
  - `index.html?backendOrigin=http://<host>:<port>`
- Если private backend недоступен, приложение блокирует инициализацию и выводит ошибку.

## Live demo

GitHub Pages не содержит private core и не предназначен для полноценной работы secure-версии.
