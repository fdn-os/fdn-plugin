import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const writer = fileURLToPath(new URL("./plant-pointers.mjs", import.meta.url));
const skill = fileURLToPath(new URL("../skills/plant-pointers/SKILL.md", import.meta.url));
const readme = fileURLToPath(new URL("../README.md", import.meta.url));

function tmpSeat() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fdn-plant-"));
}

function writeExtract(dir, files) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    if (body === null) continue;
    fs.writeFileSync(path.join(dir, name), body);
  }
}

function run(args, extraEnv = {}) {
  return spawnSync(process.execPath, [writer, ...args], {
    encoding: "utf8",
    env: { ...process.env, HOME: "/nonexistent-fdn-plant-home", ...extraEnv },
  });
}

function lstat(p) {
  return fs.lstatSync(p);
}

test("pointers are symlinks into the extract, not copies", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "# L1 C\n", "AGENTS.md": "# L1 A\n" });
  writeExtract(l2, { "CLAUDE.md": "# L2 C\n", "AGENTS.md": "# L2 A\n" });
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "sha-l1", "--l2-source", l2, "--l2-sha", "sha-l2"]);
  assert.equal(out.status, 0, out.stderr);
  const slots = {
    claudeL1: path.join(seat, ".claude/rules/L1-platform.md"),
    claudeL2: path.join(seat, ".claude/rules/L2-org.md"),
    grokL1: path.join(seat, ".grok/rules/L1-platform.md"),
    grokL2: path.join(seat, ".grok/rules/L2-org.md"),
  };
  assert.equal(lstat(slots.claudeL1).isSymbolicLink(), true);
  assert.equal(lstat(slots.claudeL2).isSymbolicLink(), true);
  assert.equal(lstat(slots.grokL1).isSymbolicLink(), true);
  assert.equal(lstat(slots.grokL2).isSymbolicLink(), true);
  assert.equal(fs.readFileSync(slots.claudeL1, "utf8"), "# L1 C\n");
  assert.equal(fs.readFileSync(slots.claudeL2, "utf8"), "# L2 C\n");
  assert.equal(fs.readFileSync(slots.grokL1, "utf8"), "# L1 A\n");
  assert.equal(fs.readFileSync(slots.grokL2, "utf8"), "# L2 A\n");
  assert.equal(path.basename(fs.readlinkSync(slots.claudeL1)), "CLAUDE.md");
  assert.equal(path.basename(fs.readlinkSync(slots.grokL1)), "AGENTS.md");
  const extractRoot = path.join(seat, ".fdn/extract");
  assert.ok(path.resolve(path.dirname(slots.claudeL1), fs.readlinkSync(slots.claudeL1)).startsWith(extractRoot));
  assert.ok(path.resolve(path.dirname(slots.claudeL2), fs.readlinkSync(slots.claudeL2)).startsWith(extractRoot));
  assert.equal(JSON.parse(fs.readFileSync(path.join(extractRoot, "l1/.generation.json"), "utf8")).sha, "sha-l1");
  assert.equal(JSON.parse(fs.readFileSync(path.join(extractRoot, "l2/acme/.generation.json"), "utf8")).sha, "sha-l2");
  assert.match(out.stdout, /l1_sha: sha-l1/);
  assert.match(out.stdout, /l2_sha: sha-l2/);
  fs.rmSync(seat, { recursive: true, force: true });
});

test("next extract is visible without re-planting the slot path", () => {
  const seat = tmpSeat();
  const l1a = path.join(seat, "src-l1a");
  const l1b = path.join(seat, "src-l1b");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1a, { "CLAUDE.md": "one\n", "AGENTS.md": "oneA\n" });
  writeExtract(l1b, { "CLAUDE.md": "two\n", "AGENTS.md": "twoA\n" });
  writeExtract(l2, { "CLAUDE.md": "org\n", "AGENTS.md": "orgA\n" });
  assert.equal(run(["--home", seat, "--org", "acme", "--l1-source", l1a, "--l1-sha", "1", "--l2-source", l2, "--l2-sha", "o"]).status, 0);
  const slot = path.join(seat, ".claude/rules/L1-platform.md");
  const before = fs.readlinkSync(slot);
  assert.equal(run(["--home", seat, "--org", "acme", "--l1-source", l1b, "--l1-sha", "2", "--l2-source", l2, "--l2-sha", "o"]).status, 0);
  assert.equal(fs.readlinkSync(slot), before);
  assert.equal(fs.readFileSync(slot, "utf8"), "two\n");
  fs.rmSync(seat, { recursive: true, force: true });
});

test("unmanaged occupied slot is left in place and fails the writer", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  const occupied = path.join(seat, ".claude/rules/L2-org.md");
  fs.mkdirSync(path.dirname(occupied), { recursive: true });
  fs.writeFileSync(occupied, "user file\n");
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "s1", "--l2-source", l2, "--l2-sha", "s2"]);
  assert.equal(out.status, 1);
  assert.equal(lstat(occupied).isSymbolicLink(), false);
  assert.equal(fs.readFileSync(occupied, "utf8"), "user file\n");
  assert.equal(lstat(path.join(seat, ".claude/rules/L1-platform.md")).isSymbolicLink(), true);
  assert.match(out.stderr, /L2-org\.md/);
  fs.rmSync(seat, { recursive: true, force: true });
});

test("symlink whose target is not this extract is unmanaged", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  const occupied = path.join(seat, ".grok/rules/L2-org.md");
  fs.mkdirSync(path.dirname(occupied), { recursive: true });
  fs.symlinkSync("/tmp/foreign-agents.md", occupied);
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l2-source", l2]);
  assert.equal(out.status, 1);
  assert.equal(fs.readlinkSync(occupied), "/tmp/foreign-agents.md");
  fs.rmSync(seat, { recursive: true, force: true });
});

test("empty extract is not a delete", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  const empty = path.join(seat, "src-empty");
  writeExtract(l1, { "CLAUDE.md": "keep-l1\n", "AGENTS.md": "keep-l1a\n" });
  writeExtract(l2, { "CLAUDE.md": "keep-l2\n", "AGENTS.md": "keep-l2a\n" });
  writeExtract(empty, { "CLAUDE.md": "  \n", "AGENTS.md": "" });
  assert.equal(run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "s1", "--l2-source", l2, "--l2-sha", "s2"]).status, 0);
  const live = path.join(seat, ".fdn/extract/l2/acme/CLAUDE.md");
  const slot = path.join(seat, ".claude/rules/L2-org.md");
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "s1", "--l2-source", empty, "--l2-sha", "s3", "--require-l2"]);
  assert.equal(out.status, 2);
  assert.equal(fs.readFileSync(live, "utf8"), "keep-l2\n");
  assert.equal(fs.readFileSync(slot, "utf8"), "keep-l2\n");
  assert.equal(JSON.parse(fs.readFileSync(path.join(seat, ".fdn/extract/l2/acme/.generation.json"), "utf8")).sha, "s2");
  fs.rmSync(seat, { recursive: true, force: true });
});

test("empty L2 with --require-l2 does not plant L1 either", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const empty = path.join(seat, "src-empty");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(empty, { "CLAUDE.md": "", "AGENTS.md": " \n" });
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l2-source", empty, "--require-l2"]);
  assert.equal(out.status, 2);
  assert.equal(fs.existsSync(path.join(seat, ".fdn/extract/l1")), false);
  assert.equal(fs.existsSync(path.join(seat, ".claude/rules/L1-platform.md")), false);
  fs.rmSync(seat, { recursive: true, force: true });
});

test("L3 path is never opened or rewritten", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  const l3 = path.join(seat, ".claude/CLAUDE.md");
  fs.mkdirSync(path.dirname(l3), { recursive: true });
  fs.writeFileSync(l3, "personal L3\n");
  const userAgents = path.join(seat, "AGENTS.md");
  fs.writeFileSync(userAgents, "personal agents\n");
  const projectClaude = path.join(seat, "project/CLAUDE.md");
  fs.mkdirSync(path.dirname(projectClaude), { recursive: true });
  fs.writeFileSync(projectClaude, "project L4\n");
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l2-source", l2]);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(fs.readFileSync(l3, "utf8"), "personal L3\n");
  assert.equal(lstat(l3).isSymbolicLink(), false);
  assert.equal(fs.readFileSync(userAgents, "utf8"), "personal agents\n");
  assert.equal(fs.readFileSync(projectClaude, "utf8"), "project L4\n");
  fs.rmSync(seat, { recursive: true, force: true });
});

test("missing L3 is not created", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  assert.equal(run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l2-source", l2]).status, 0);
  assert.equal(fs.existsSync(path.join(seat, ".claude/CLAUDE.md")), false);
  fs.rmSync(seat, { recursive: true, force: true });
});

test("same SHA is a no-op on the extract", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  assert.equal(run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "same", "--l2-source", l2, "--l2-sha", "same2"]).status, 0);
  const sentinel = path.join(seat, ".fdn/extract/l1/SENTINEL");
  fs.writeFileSync(sentinel, "keep\n");
  writeExtract(l1, { "CLAUDE.md": "CHANGED\n", "AGENTS.md": "CHANGEDA\n" });
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "same", "--l2-source", l2, "--l2-sha", "same2"]);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(fs.readFileSync(sentinel, "utf8"), "keep\n");
  assert.equal(fs.readFileSync(path.join(seat, ".fdn/extract/l1/CLAUDE.md"), "utf8"), "L1\n");
  fs.rmSync(seat, { recursive: true, force: true });
});

test("skip L1 when source is absent; still plant L2", () => {
  const seat = tmpSeat();
  const l2 = path.join(seat, "src-l2");
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  const out = run(["--home", seat, "--org", "acme", "--l2-source", l2, "--l2-sha", "s2"]);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(fs.existsSync(path.join(seat, ".claude/rules/L1-platform.md")), false);
  assert.equal(fs.existsSync(path.join(seat, ".grok/rules/L1-platform.md")), false);
  assert.equal(lstat(path.join(seat, ".claude/rules/L2-org.md")).isSymbolicLink(), true);
  assert.match(out.stdout, /L1-platform\.md skipped/);
  fs.rmSync(seat, { recursive: true, force: true });
});

test("dirty L1 pin skips L1 and still plants L2", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "fetched", "--l1-pin", "pinned", "--l2-source", l2]);
  assert.equal(out.status, 3);
  assert.equal(fs.existsSync(path.join(seat, ".claude/rules/L1-platform.md")), false);
  assert.equal(lstat(path.join(seat, ".claude/rules/L2-org.md")).isSymbolicLink(), true);
  fs.rmSync(seat, { recursive: true, force: true });
});

test("managed pointer under this extract is retargeted to the live file", () => {
  const seat = tmpSeat();
  const l1 = path.join(seat, "src-l1");
  const l2 = path.join(seat, "src-l2");
  writeExtract(l1, { "CLAUDE.md": "L1\n", "AGENTS.md": "L1A\n" });
  writeExtract(l2, { "CLAUDE.md": "L2\n", "AGENTS.md": "L2A\n" });
  const extractRoot = path.join(seat, ".fdn/extract");
  const other = path.join(extractRoot, "old-l1");
  fs.mkdirSync(other, { recursive: true });
  fs.writeFileSync(path.join(other, "CLAUDE.md"), "old\n");
  const slot = path.join(seat, ".claude/rules/L1-platform.md");
  fs.mkdirSync(path.dirname(slot), { recursive: true });
  fs.symlinkSync(path.join(other, "CLAUDE.md"), slot);
  const out = run(["--home", seat, "--org", "acme", "--l1-source", l1, "--l1-sha", "n", "--l2-source", l2, "--l2-sha", "n2"]);
  assert.equal(out.status, 0, out.stderr);
  const target = path.resolve(path.dirname(slot), fs.readlinkSync(slot));
  assert.equal(target, path.join(extractRoot, "l1/CLAUDE.md"));
  assert.equal(fs.readFileSync(slot, "utf8"), "L1\n");
  fs.rmSync(seat, { recursive: true, force: true });
});

test("skill, writer, and README do not store tokens or name Grain as the product", () => {
  const files = {
    writer: fs.readFileSync(writer, "utf8"),
    skill: fs.readFileSync(skill, "utf8"),
    readme: fs.readFileSync(readme, "utf8"),
    l1Claude: fs.readFileSync(fileURLToPath(new URL("../CLAUDE.md", import.meta.url)), "utf8"),
    l1Agents: fs.readFileSync(fileURLToPath(new URL("../AGENTS.md", import.meta.url)), "utf8"),
  };
  const hits = [];
  for (const name of ["writer", "skill", "l1Claude", "l1Agents"]) {
    for (const line of productGrain(files[name])) hits.push(`${name}: ${line.trim()}`);
    assert.doesNotMatch(files[name], /OnUnitActiveSec/);
  }
  assert.deepEqual(hits, []);
  assert.doesNotMatch(files.l1Claude, /accountId/);
  assert.doesNotMatch(files.l1Agents, /accountId/);
  assert.doesNotMatch(files.writer, /accountId/);
  assert.doesNotMatch(files.l1Claude, /cfat_|sk-live-|Bearer [A-Za-z0-9._-]{12,}/);
  assert.doesNotMatch(files.l1Agents, /cfat_|sk-live-|Bearer [A-Za-z0-9._-]{12,}/);
  assert.match(files.skill, /never GitHub as VCS/i);
  assert.match(files.skill, /never Grain/i);
  assert.match(files.skill, /Do \*\*not\*\* print minted repo tokens, `accountId`/);
  assert.match(files.readme, /never copies/);
});

function productGrain(text) {
  return text.split(/\n/).filter((line) => /\bGrain\b/.test(line) && !/\bnot Grain\b|\bnever Grain\b/i.test(line));
}
