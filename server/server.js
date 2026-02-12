const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();
const REPO_ROOT = path.resolve(__dirname, "..");
const INDEX_HTML_PATH = path.resolve(REPO_ROOT, "index.html");
const SAMPLE_DIR = path.resolve(REPO_ROOT, "sample");
const REFS_DIR = path.resolve(REPO_ROOT, "refs");
const PRIVATE_CORE_DIR = path.resolve(__dirname, "..", "private-core", "private");
const CORE_ACCESS_KEY = String(process.env.CORE_ACCESS_KEY || "").trim();

const PORT = Number(process.env.PORT || 8787);
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONT_ORIGIN,
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-core-key"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.sendFile(INDEX_HTML_PATH);
});

app.get("/index.html", (_req, res) => {
  res.sendFile(INDEX_HTML_PATH);
});

app.use(
  "/sample",
  express.static(SAMPLE_DIR, {
    fallthrough: true,
    maxAge: "5m",
  })
);

app.use(
  "/refs",
  express.static(REFS_DIR, {
    fallthrough: true,
    maxAge: "30d",
  })
);

function getCorePath(fileName) {
  const resolved = path.resolve(PRIVATE_CORE_DIR, fileName);
  const expectedPrefix = PRIVATE_CORE_DIR + path.sep;
  if (!resolved.startsWith(expectedPrefix)) return null;
  return resolved;
}

function isCoreAuthorized(req) {
  if (!CORE_ACCESS_KEY) return true;
  const queryKey = typeof req?.query?.k === "string" ? req.query.k : "";
  const headerKey = String(req.get("x-core-key") || "");
  const provided = queryKey || headerKey;
  return Boolean(provided) && provided === CORE_ACCESS_KEY;
}

function requireCoreAuth(req, res, next) {
  if (isCoreAuthorized(req)) return next();
  return res.status(401).json({
    error: "UNAUTHORIZED",
    message: "Private core access denied.",
  });
}

function sendCoreScript(res, fileName) {
  const corePath = getCorePath(fileName);
  if (!corePath) {
    return res.status(400).json({ error: "INVALID_CORE_PATH" });
  }
  if (!fs.existsSync(corePath)) {
    return res.status(503).json({
      error: "CORE_UNAVAILABLE",
      message: "Private core is not available on this deployment.",
    });
  }
  const body = fs.readFileSync(corePath, "utf8");
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(body);
}

function hasCoreFiles() {
  const matricesPath = getCorePath("matrices.js");
  const constraintsPath = getCorePath("constraints.js");
  return Boolean(
    matricesPath
      && constraintsPath
      && fs.existsSync(matricesPath)
      && fs.existsSync(constraintsPath)
  );
}

app.get("/health", (_req, res) => {
  return res.json({
    ok: true,
    core: {
      available: hasCoreFiles(),
      protected: Boolean(CORE_ACCESS_KEY),
    },
  });
});

app.get("/core/health", requireCoreAuth, (_req, res) => {
  const ok = hasCoreFiles();
  return res.json({ ok, protected: Boolean(CORE_ACCESS_KEY) });
});

app.get("/core/matrices.js", requireCoreAuth, (_req, res) => sendCoreScript(res, "matrices.js"));
app.get("/core/constraints.js", requireCoreAuth, (_req, res) => sendCoreScript(res, "constraints.js"));

app.use((err, _req, res, _next) => {
  console.error("[middleware error]:", err);

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
  console.log(`Prompt Builder backend listening on http://localhost:${PORT}`);
});
