// Lightweight DOM harness checks app wiring without a browser or UI dependency.
import assert from "node:assert/strict";
import { missions } from "../dist/course.js";
import { HOME } from "../dist/shell.js";
const nodes = new Map();
class Element {
  constructor() {
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.children = [];
    this.style = {};
    this.firstElementChild = { style: {} };
    this.attributes = {};
  }
  append(el) {
    this.children.push(el);
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  querySelector(s) {
    return get(s);
  }
  replaceWith(el) {
    this.replacement = el;
  }
}
const get = (s) => {
  if (!nodes.has(s)) nodes.set(s, new Element());
  return nodes.get(s);
};
const target = missions.findIndex((m) => m.title === "Go up one level");
const initial = {
  completed: Array.from({ length: target }, (_, i) => i),
  sessions: { [target]: { hint: 1 } },
  seconds: 0,
  days: [],
  missionIds: missions.map((m) => m.id),
};
const storage = new Map([["prompt-lab-v1", JSON.stringify(initial)]]);
globalThis.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
};
globalThis.location = { hash: "#practice/" + target };
globalThis.window = {
  history: {
    replaceState: (_, __, url) => {
      location.hash = url;
    },
  },
};
globalThis.document = {
  querySelector: (s) => (s === ".worked-example" ? null : get(s)),
  createElement: () => new Element(),
  addEventListener: () => {},
  hidden: false,
};
const handlers = {};
globalThis.addEventListener = (k, fn) => (handlers[k] = fn);
globalThis.setInterval = () => 0;
await import("../dist/app.js");
assert.match(get("#app").innerHTML, /HOW TO USE IT/);
assert.match(get("#app").innerHTML, /MISSION 6 OF 12/);
assert.equal(
  get("#prompt").textContent,
  "~/projects/robot $",
  "hint-only saved attempts retain lesson starting directory",
);
assert.equal(
  get("#feedback").innerHTML,
  "",
  "worked examples must not complete the exercise",
);
get("#command").value = "cd ..";
get("#terminal-form").onsubmit({ preventDefault() {} });
assert.match(get("#feedback").innerHTML, /Mission complete/);
assert.equal(get("#prompt").textContent, "~/projects $");
assert.ok(JSON.parse(storage.get("prompt-lab-v1")).completed.includes(target));
location.hash = "#course";
handlers.hashchange();
assert.match(get("#app").innerHTML, /\/ 46/);
assert.match(get("#app").innerHTML, /6 \/ 12 missions/);
assert.equal(
  get("#app").innerHTML.includes("${missions.length}"),
  false,
  "no unresolved template text",
);
console.log(
  "PASS: worked example rendering, variable lesson counters, custom starting directory, terminal completion, and saved UI progress.",
);
