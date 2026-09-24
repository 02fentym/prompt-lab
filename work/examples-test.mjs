import assert from "node:assert/strict";
import { mountExample } from "../dist/examples.js";
let pending = new Map(),
  id = 0,
  change;
globalThis.setTimeout = (fn) => {
  pending.set(++id, fn);
  return id;
};
globalThis.clearTimeout = (id) => pending.delete(id);
const motion = {
  matches: false,
  addEventListener: (_, fn) => (change = fn),
  removeEventListener: () => {
    change = null;
  },
};
globalThis.window = { matchMedia: () => motion };
globalThis.document = { hidden: false };
function node(textContent = "") {
  return { textContent, style: {}, hidden: true, disabled: false };
}
function fixture() {
  const commands = ["pwd", "ls data"];
  const steps = commands.map((text) => {
    const map = {
      ".example-command": node(text),
      ".example-result": node("result"),
      ".example-cursor": node(),
    };
    return { querySelector: (s) => map[s], map };
  });
  const controls = {
    ".example-replay": node(),
    ".example-finish": node(),
    ".example-status": node(),
  };
  return {
    steps,
    controls,
    querySelectorAll: () => steps,
    querySelector: (s) => controls[s],
  };
}
function tick() {
  const [key, fn] = pending.entries().next().value;
  pending.delete(key);
  fn();
}
const root = fixture();
const dispose = mountExample(root);
assert.equal(root.steps[0].map[".example-command"].textContent, "");
assert.equal(root.steps[0].map[".example-result"].style.visibility, "hidden");
tick();
assert.equal(root.steps[0].map[".example-command"].textContent, "p");
assert.equal(root.steps[1].map[".example-command"].textContent, "");
tick();
tick();
assert.equal(root.steps[0].map[".example-command"].textContent, "pwd");
assert.equal(root.steps[0].map[".example-result"].style.visibility, "hidden");
tick();
assert.equal(root.steps[0].map[".example-result"].style.visibility, "visible");
while (pending.size) tick();
assert.equal(root.steps[1].map[".example-command"].textContent, "ls data");
assert.equal(root.controls[".example-status"].textContent, "Example complete");
root.controls[".example-replay"].onclick();
assert.equal(root.steps[0].map[".example-command"].textContent, "");
root.controls[".example-finish"].onclick();
assert.equal(pending.size, 0);
assert.equal(root.steps[1].map[".example-result"].style.visibility, "visible");
root.controls[".example-replay"].onclick();
document.hidden = true;
tick();
assert.equal(root.steps[0].map[".example-command"].textContent, "");
document.hidden = false;
motion.matches = true;
change();
assert.equal(pending.size, 0);
assert.equal(root.steps[0].map[".example-command"].textContent, "pwd");
dispose();
assert.equal(change, null);
assert.equal(pending.size, 0);
const reduced = fixture();
mountExample(reduced);
assert.equal(pending.size, 0);
assert.equal(reduced.steps[0].map[".example-command"].textContent, "pwd");
console.log(
  "PASS: sequential typing, delayed results, replay, skip, background pause, reduced motion, and disposal.",
);
