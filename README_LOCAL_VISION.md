# Локальный запуск (OpenAI Vision + backend + frontend)

## Подготовка

1. Создайте файл `server/.env`:

```bash
cp server/.env.example server/.env
```

2. Вставьте ключ в `server/.env`:

```env
OPENAI_API_KEY=sk-...
```

## One-click start (macOS)

```bash
cd /Users/alexandrkorlykhanov/Desktop/prompt builder
chmod +x start.command stop.command restart.command
./start.command
```

Остановка:

```bash
./stop.command
```

## Проверка

```bash
./start.command
open http://localhost:5173
curl http://localhost:8787/health
```
