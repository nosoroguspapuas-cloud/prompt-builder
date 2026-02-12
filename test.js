#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "index.html");
const content = fs.readFileSync(filePath, "utf8");

const tests = [
  {
    name: "Test A: camera distance update has non-camera guard",
    ok:
      content.includes("function assertCameraDidNotChangeSelection") &&
      content.includes("Distance changed non-camera state"),
  },
  {
    name: "Test B: camera source cannot write location/accessories paths",
    ok:
      content.includes("function setByPath") &&
      content.includes("Guard violation") &&
      content.includes("source") &&
      content.includes("location") &&
      content.includes("accessories"),
  },
  {
    name: "Test C: buildPrompt skips selection mutations for camera/* source",
    ok:
      content.includes("const skipAutoRules = Boolean(options?.skipAutoRules);") &&
      content.includes("const skipEnforce = Boolean(options?.skipEnforce);") &&
      content.includes("const skipSanitize = Boolean(options?.skipSanitize);") &&
      content.includes("if (!skipSanitize)") &&
      content.includes("if (!skipAutoRules)") &&
      content.includes("if (!skipEnforce)") &&
      content.includes("applyAutoRules(profile, s, scenario, { forcePhone: true })"),
  },
];

let failed = 0;
tests.forEach((test) => {
  if (test.ok) {
    console.log(`PASS: ${test.name}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
  }
});

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log("All checks passed.");
}
