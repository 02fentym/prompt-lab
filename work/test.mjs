import assert from "node:assert/strict";
import { Shell, HOME } from "../dist/shell.js";
import { chapters, missions, legacyMissionIds } from "../dist/course.js";
import { migrateProgress } from "../dist/progress.js";
function practice(m) {
  const s = new Shell();
  s.cwd = m.start || HOME;
  Object.assign(s.fs, m.files || {});
  return s;
}
for (const m of missions) {
  const s = practice(m);
  assert.equal(m.check(s), false, m.title + " must not pass initially");
  const events = [];
  for (const line of m.answer.split("\n")) {
    const r = s.run(line);
    events.push(...r.events);
  }
  s.events = events;
  assert.equal(m.check(s), true, m.title + " solution");
  assert.ok(
    m.example?.syntax && m.example.steps.length,
    m.title + " requires instruction",
  );
  const demo = new Shell();
  demo.cwd = m.example.start;
  Object.assign(demo.fs, m.files || {});
  for (const step of m.example.steps) {
    assert.ok(step.explanation, m.title + " explains each step");
    const r = demo.run(step.command);
    if (r.stderr)
      assert.equal(
        m.title,
        "Recover from a wrong turn",
        m.title + " demo error: " + r.stderr,
      );
  }
  assert.equal(
    m.check(practice(m)),
    false,
    m.title + " examples cannot complete practice",
  );
}
assert.equal(missions.length, 46);
assert.equal(new Set(missions.map((m) => m.id)).size, 46);
let offset = 0;
for (const c of chapters) {
  assert.equal(c.start, offset);
  assert.equal(c.missions.filter((m) => m.challenge).length, 1);
  assert.equal(c.missions.at(-1).challenge, true);
  offset += c.missions.length;
}
assert.equal(missions.filter((m) => m.answer === "pwd").length, 1);
const saved = {
  completed: [0, 2, 4, 27],
  sessions: {
    2: { cwd: HOME + "/projects/robot", hint: 2 },
    4: { history: ["touch draft.txt"] },
  },
  seconds: 120,
  days: ["2026-09-18"],
};
const migration = migrateProgress(saved, missions, legacyMissionIds);
assert.deepEqual(
  migration.state.completed.map((i) => missions[i].title),
  [
    "You are here",
    "Make a move",
    "Your first file",
    "Final challenge: the handoff",
  ],
);
assert.equal(
  migration.state.sessions[missions.findIndex((m) => m.title === "Make a move")]
    .hint,
  2,
);
assert.equal(migration.state.seconds, 120);
assert.deepEqual(migration.state.days, saved.days);
assert.deepEqual(
  migrateProgress(migration.state, missions, legacyMissionIds).state,
  migration.state,
  "migration is idempotent",
);
assert.equal(
  migration.state.completed.includes(
    missions.findIndex((m) => m.title === "Go up one level"),
  ),
  false,
  "new lessons are not accidentally completed",
);
const s = new Shell();
assert.match(s.run("cat missing.txt 2> errors.txt").stdout, /^$/);
assert.match(s.file("errors.txt"), /not found/);
assert.equal(s.run('echo "a | b"').stdout, "a | b\n");
assert.equal(s.run("cat data/day[12].txt | wc -l").stdout, "2\n");
assert.equal(s.run("cat data/day?.txt").stdout, "Monday\nTuesday\n");
assert.match(s.run("cp projects backup").stderr, /use -r/);
assert.match(s.run('echo "unfinished').stderr, /Unclosed quote/);
assert.match(s.run("cat notes.txt |").stderr, /both sides/);
s.run("echo test > x");
s.run("echo two >> x");
assert.equal(s.file("x"), "test\ntwo\n");
s.run("echo reset > x");
assert.equal(s.file("x"), "reset\n");
assert.equal(s.run("tail -n 0 notes.txt").stdout, "");
console.log(
  "PASS: 46 solutions and examples, initial-state rejection, variable chapter sizes, progress migration, and shell edge cases.",
);
