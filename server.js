const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 50);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 240000);
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-4.1-mini";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

const PORT = Number(process.env.PORT || 8787);
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:5173";

const MASTER_PROMPT = [
  "Составь Character Master (EN) для стабильной генерации одного и того же персонажа.",
  "Кратко, списком атрибутов: возраст, кожа, волосы, лицо, отличительные признаки, стиль.",
  "Без упоминания брендов, без догадок о личности.",
  "Сразу добавь RU-перевод.",
  "Верни строго JSON-объект с ключами en и ru.",
  'Пример формата: {"en":"...","ru":"..."}',
].join(" ");

app.use(
  cors({
    origin: FRONT_ORIGIN,
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

function appError(code, message, status = 500) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function extractTextFromResponse(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}

function parseEnRu(text) {
  const raw = String(text || "").trim();
  if (!raw) throw appError("INTERNAL", "Ошибка сервера. Смотрите server log", 500);

  try {
    const parsed = JSON.parse(raw);
    const en = String(parsed?.en || "").trim();
    const ru = String(parsed?.ru || "").trim();
    if (en && ru) return { en, ru };
  } catch {
    // fallback below
  }

  const cleaned = raw.replace(/```json|```/gi, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const en = String(parsed?.en || "").trim();
    const ru = String(parsed?.ru || "").trim();
    if (en && ru) return { en, ru };
  } catch {
    // fallback below
  }

  const lines = cleaned
    .split("\n")
    .map(v => v.trim())
    .filter(Boolean);

  let en = "";
  let ru = "";
  for (const line of lines) {
    if (!en && /^en\s*:/i.test(line)) en = line.replace(/^en\s*:\s*/i, "").trim();
    if (!ru && /^ru\s*:/i.test(line)) ru = line.replace(/^ru\s*:\s*/i, "").trim();
  }

  if (en && ru) return { en, ru };
  throw appError("INTERNAL", "Ошибка сервера. Смотрите server log", 500);
}

async function callOpenAIWithVision(dataUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw appError("INTERNAL", "Ошибка сервера. Смотрите server log", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: MASTER_PROMPT },
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("[openai error]", response.status, details);
      throw appError("INTERNAL", "Ошибка сервера. Смотрите server log", 500);
    }

    const data = await response.json();
    const text = extractTextFromResponse(data);
    return parseEnRu(text);
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw appError("TIMEOUT", "Слишком долго. Попробуйте фото меньше/проще", 504);
    }
    if (error && error.code) throw error;
    throw appError("INTERNAL", "Ошибка сервера. Смотрите server log", 500);
  } finally {
    clearTimeout(timeout);
  }
}

app.get("/health", (_req, res) => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (!hasKey) {
    return res.status(500).json({ ok: false, error: "MISSING_OPENAI_API_KEY" });
  }
  return res.json({ ok: true, model: OPENAI_MODEL });
});

app.post("/describe", upload.single("image"), async (req, res) => {
  const reqId = Date.now().toString(36);
  try {
    console.log(`[${reqId}] start request`);

    if (!req.file || !req.file.buffer?.length) {
      throw appError("INTERNAL", "Ошибка сервера. Смотрите server log", 400);
    }

    console.log(`[${reqId}] file received (size: ${req.file.size} bytes)`);

    const mimeType = req.file.mimetype || "image/jpeg";
    const base64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`[${reqId}] calling openai responses`);
    const result = await callOpenAIWithVision(dataUrl);
    console.log(`[${reqId}] openai done`);

    res.json(result);
    console.log(`[${reqId}] response sent`);
  } catch (error) {
    console.error(`[${reqId}] request failed:`, error);

    if (error && error.code === "TIMEOUT") {
      return res.status(error.status || 504).json({
        error: "TIMEOUT",
        message: "Слишком долго. Попробуйте фото меньше/проще",
      });
    }

    return res.status(error?.status || 500).json({
      error: "INTERNAL",
      message: "Ошибка сервера. Смотрите server log",
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error("[middleware error]:", err);

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "FILE_TOO_LARGE",
      message: `Файл слишком большой. Максимум: ${MAX_FILE_SIZE_MB} MB`,
    });
  }

  return res.status(500).json({
    error: "INTERNAL",
    message: "Ошибка сервера. Смотрите server log",
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Маршрут не найден" });
});

process.on("uncaughtException", error => {
  console.error("[uncaughtException]:", error);
});

process.on("unhandledRejection", reason => {
  console.error("[unhandledRejection]:", reason);
});

app.listen(PORT, () => {
  console.log(`Local vision backend listening on http://localhost:${PORT}`);
});
