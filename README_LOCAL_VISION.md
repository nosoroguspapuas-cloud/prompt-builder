# Локальный запуск (backend + frontend)

## Подготовка (опционально)

Если нужно задать CORS/Core-key, создайте `server/.env`:

```bash
cp server/.env.example server/.env
```

## One-click start (macOS)

```bash
cd /Users/alexandrkorlykhanov/Desktop/PromptBuilder/prompt-builder
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
