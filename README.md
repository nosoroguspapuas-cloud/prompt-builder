# Prompt Builder (OpenAI Vision)

## Быстрый старт

1. Создайте `server/.env`:

```bash
cp server/.env.example server/.env
```

2. Вставьте ключ в `server/.env`:

```env
OPENAI_API_KEY=sk-...
```

3. Дайте права и запустите:

```bash
chmod +x start.command stop.command restart.command
./start.command
```

## Проверка

```bash
./start.command
open http://localhost:5173
curl http://localhost:8787/health
```

Если `health` вернул `{"ok":false,"error":"NO_KEY"}`, проверьте `server/.env`.

