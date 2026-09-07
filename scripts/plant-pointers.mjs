#!/usr/bin/env node
/**
 * Seat writer: extract L1 then L2, then plant four managed rules pointers.
 * Pointers are symlinks, never copies. Unmanaged occupied slots fail closed.
 * Empty source is not a delete. Does not rewrite L3 or L4.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const USAGE = `usage: plant-pointers --org <slug> [--home <dir>] [--extract-root <dir>]
       [--l1-source <dir>] [--l1-sha <sha>] [--l1-pin <sha>]
       [--l2-source <dir>] [--l2-sha <sha>] [--require-l2]`;

const ORG_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const EXTRACT_FILES = ["CLAUDE.md", "AGENTS.md"];

function fail(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const out = {
    home: process.env.HOME || os.homedir(),
    extractRoot: "",
    org: "",
    l1Source: "",
    l1Sha: "",
    l1Pin: "",
    l2Source: "",
    l2Sha: "",
    requireL2: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) fail(4, USAGE);
      return value;
    };
    if (arg === "--home") out.home = next();
    else if (arg === "--extract-root") out.extractRoot = next();
    else if (arg === "--org") out.org = next();
    else if (arg === "--l1-source") out.l1Source = next();
    else if (arg === "--l1-sha") out.l1Sha = next();
    else if (arg === "--l1-pin") out.l1Pin = next();
    else if (arg === "--l2-source") out.l2Source = next();
    else if (arg === "--l2-sha") out.l2Sha = next();
    else if (arg === "--require-l2") out.requireL2 = true;
    else fail(4, USAGE);
  }
  return out;
}

function assertOrg(org) {
  if (!org || org.includes("..") || org.includes("/") || org.includes("\\") || org.includes("\0")) {
    fail(4, "invalid org");
  }
  if (!ORG_RE.test(org)) fail(4, "invalid org");
  return org;
}

function readSourceFile(dir, name) {
  if (!dir) return null;
  const file = path.join(dir, name);
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const text = raw.replace(/\r\n/g, "\n");
  return text.trim() ? text : null;
}

function readLiveFile(dir, name) {
  return readSourceFile(dir, name);
}

function readStamp(liveDir) {
  try {
    const rec = JSON.parse(fs.readFileSync(path.join(liveDir, ".generation.json"), "utf8"));
    return typeof rec?.sha === "string" && rec.sha ? rec.sha : "";
  } catch {
    return "";
  }
}

function hashFiles(files) {
  const h = createHash("sha256");
  for (const name of EXTRACT_FILES) {
    h.update(name);
    h.update("\0");
    h.update(files[name] ?? "");
    h.update("\0");
  }
  return h.digest("hex");
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function planLayer({ layer, sourceDir, liveDir, sha, pin }) {
  if (!sourceDir) {
    return { layer, liveDir, skipped: true, empty: false, ready: false, sameSha: false, dirtyPin: false, sha: "", files: {} };
  }
  const source = {
    "CLAUDE.md": readSourceFile(sourceDir, "CLAUDE.md"),
    "AGENTS.md": readSourceFile(sourceDir, "AGENTS.md"),
  };
  const empty = source["CLAUDE.md"] === null && source["AGENTS.md"] === null;
  const computed = sha || hashFiles(source);
  if (pin && computed !== pin) {
    return {
      layer,
      liveDir,
      skipped: true,
      empty,
      ready: false,
      sameSha: false,
      dirtyPin: true,
      sha: computed,
      files: source,
    };
  }
  if (empty) {
    return { layer, liveDir, skipped: true, empty: true, ready: false, sameSha: false, dirtyPin: false, sha: computed, files: source };
  }
  const files = {
    "CLAUDE.md": source["CLAUDE.md"] ?? readLiveFile(liveDir, "CLAUDE.md"),
    "AGENTS.md": source["AGENTS.md"] ?? readLiveFile(liveDir, "AGENTS.md"),
  };
  const sameSha = Boolean(computed) && readStamp(liveDir) === computed;
  return {
    layer,
    liveDir,
    skipped: false,
    empty: false,
    ready: true,
    sameSha,
    dirtyPin: false,
    sha: computed,
    files,
  };
}

function swapLayer(layer) {
  if (!layer.ready || layer.sameSha) return;
  const liveDir = layer.liveDir;
  const stage = `${liveDir}.staging`;
  const bak = `${liveDir}.bak`;
  rmrf(stage);
  mkdirp(stage);
  for (const name of EXTRACT_FILES) {
    const body = layer.files[name];
    if (body !== null && body !== undefined) fs.writeFileSync(path.join(stage, name), body);
  }
  fs.writeFileSync(
    path.join(stage, ".generation.json"),
    `${JSON.stringify({ sha: layer.sha, layer: layer.layer }, null, 2)}\n`,
  );
  rmrf(bak);
  if (fs.existsSync(liveDir)) fs.renameSync(liveDir, bak);
  fs.renameSync(stage, liveDir);
  rmrf(bak);
}

function extractFile(layer, sourceName) {
  if (!layer.ready) return "";
  return path.join(layer.liveDir, sourceName);
}

function resolveLinkTarget(slotPath) {
  const raw = fs.readlinkSync(slotPath);
  return path.resolve(path.dirname(slotPath), raw);
}

function isInside(root, target) {
  const rootR = path.resolve(root);
  const targetR = path.resolve(target);
  return targetR === rootR || targetR.startsWith(rootR + path.sep);
}

function slotState(slotPath, extractRoot, expectedBasename) {
  let st;
  try {
    st = fs.lstatSync(slotPath);
  } catch {
    return "missing";
  }
  if (!st.isSymbolicLink()) return "unmanaged";
  const target = resolveLinkTarget(slotPath);
  if (path.basename(target) !== expectedBasename) return "unmanaged";
  if (!isInside(extractRoot, target)) return "unmanaged";
  return "managed";
}

function plantSlot(slotPath, target, extractRoot) {
  const state = slotState(slotPath, extractRoot, path.basename(target));
  if (state === "unmanaged") return "occupied";
  if (state === "managed") {
    const current = resolveLinkTarget(slotPath);
    if (path.resolve(current) === path.resolve(target)) return "ok";
    fs.unlinkSync(slotPath);
  } else {
    mkdirp(path.dirname(slotPath));
  }
  fs.symlinkSync(target, slotPath);
  return "ok";
}

function displaySlot(home, slotPath) {
  const abs = path.resolve(slotPath);
  const prefix = path.resolve(home) + path.sep;
  if (abs.startsWith(prefix)) return `~/${abs.slice(prefix.length).replaceAll("\\", "/")}`;
  if (abs === path.resolve(home)) return "~";
  return abs;
}

function main(argv) {
  const args = parseArgs(argv);
  const home = path.resolve(args.home);
  const extractRoot = path.resolve(args.extractRoot || path.join(home, ".fdn", "extract"));
  if (args.l2Source && !args.org) fail(4, "invalid org");
  const org = args.org ? assertOrg(args.org) : "";

  const l1 = planLayer({
    layer: "l1",
    sourceDir: args.l1Source,
    liveDir: path.join(extractRoot, "l1"),
    sha: args.l1Sha,
    pin: args.l1Pin,
  });
  const l2 = planLayer({
    layer: "l2",
    sourceDir: args.l2Source,
    liveDir: org ? path.join(extractRoot, "l2", org) : "",
    sha: args.l2Sha,
    pin: "",
  });

  if (l1.dirtyPin) {
    process.stderr.write("L1 sha does not match pin; L1 not planted\n");
  }
  if (args.requireL2 && (l2.skipped || l2.empty)) {
    fail(2, "empty L2 extract; yesterday stays");
  }

  swapLayer(l1);
  swapLayer(l2);

  const slots = [
    { layer: l1, rel: ".claude/rules/L1-platform.md", sourceName: "CLAUDE.md" },
    { layer: l2, rel: ".claude/rules/L2-org.md", sourceName: "CLAUDE.md" },
    { layer: l1, rel: ".grok/rules/L1-platform.md", sourceName: "AGENTS.md" },
    { layer: l2, rel: ".grok/rules/L2-org.md", sourceName: "AGENTS.md" },
  ];

  const occupied = [];
  const lines = [];
  lines.push(`org: ${org || "-"}`);
  lines.push(`l1_sha: ${l1.skipped ? "-" : l1.sha}`);
  lines.push(`l2_sha: ${l2.skipped ? "-" : l2.sha}`);

  for (const slot of slots) {
    const slotPath = path.join(home, slot.rel);
    const shown = displaySlot(home, slotPath);
    if (slot.layer.skipped || slot.layer.empty) {
      lines.push(`${shown} skipped`);
      continue;
    }
    const target = extractFile(slot.layer, slot.sourceName);
    if (!target || !fs.existsSync(target)) {
      lines.push(`${shown} skipped`);
      continue;
    }
    const result = plantSlot(slotPath, target, extractRoot);
    if (result === "occupied") {
      occupied.push(slotPath);
      lines.push(`${shown} occupied unmanaged`);
      continue;
    }
    lines.push(`${shown} -> ${target}`);
  }

  process.stdout.write(`${lines.join("\n")}\n`);
  if (occupied.length) {
    process.stderr.write(`occupied unmanaged: ${occupied.join(", ")}\n`);
    process.exit(1);
  }
  if (args.l2Source && l2.empty && !args.requireL2) {
    process.stderr.write("empty L2 extract; yesterday stays\n");
    process.exit(2);
  }
  if (l1.dirtyPin) process.exit(3);
}

main(process.argv.slice(2));
