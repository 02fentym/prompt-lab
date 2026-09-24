import { Shell, HOME, resolve } from "./shell.js";
import { chapters, missions, legacyMissionIds } from "./course.js";
import { migrateProgress } from "./progress.js";
import { mountExample } from "./examples.js";
let disposeExample = () => {};
const app = document.querySelector("#app");
const landing = `<div class="wrap"><div class="stats"><div class="stat"><strong>7</strong><span>FOCUSED CHAPTERS</span></div><div class="stat"><strong>${missions.length}</strong><span>HANDS-ON MISSIONS</span></div><div class="stat"><strong>100%</strong><span>IN YOUR BROWSER</span></div><div class="stat"><strong>$0</strong><span>ALWAYS FREE</span></div></div><div class="section-head"><div><span class="eyebrow">THE LEARNING PATH</span><h2>Build your command of the terminal.</h2></div><a href="#course" class="micro">VIEW ALL CHAPTERS ↗</a></div><a class="chapter-row" href="#practice/0"><span class="num">01</span><h3>Find your bearings</h3><code>pwd · ls · cd · paths</code><small>${chapters[0].missions.length} missions</small><span>↗</span></a></div>`;
const KEY = "prompt-lab-v1";
const fresh = () => migrateProgress(null, missions, legacyMissionIds).state;
let storageOK = true,
  state;
try {
  const stored = JSON.parse(localStorage.getItem(KEY));
  const migration = migrateProgress(stored, missions, legacyMissionIds);
  state = migration.state;
  // Preserve a bookmarked mission when inserting lessons shifts its numeric route.
  const route = location.hash.match(/^#practice\/(\d+)$/);
  if (stored && route && migration.indexMap[Number(route[1])] >= 0) {
    window.history.replaceState(
      null,
      "",
      "#practice/" + migration.indexMap[Number(route[1])],
    );
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
  }
} catch {
  state = fresh();
  storageOK = false;
}
let current = -1,
  shell,
  events = [],
  history = [],
  historyIndex = 0;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
  }
};
const unlocked = (i) => i <= Math.max(-1, ...state.completed) + 1;
const next = () => missions.findIndex((_, i) => !state.completed.includes(i));
function day() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function streak() {
  let n = 0,
    d = new Date();
  if (!state.days.includes(day())) d.setDate(d.getDate() - 1);
  while (
    state.days.includes(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    )
  ) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function record() {
  if (current < 0 || !shell) return;
  const session = state.sessions[current] || {};
  state.sessions[current] = {
    ...session,
    fs: shell.fs,
    cwd: shell.cwd,
    events,
    history,
  };
  save();
}
function rows() {
  return chapters
    .map((c, i) => {
      const done = c.missions.filter((_, j) =>
        state.completed.includes(c.start + j),
      ).length;
      const available = unlocked(c.start);
      const unfinished = c.missions.findIndex(
        (_, j) => !state.completed.includes(c.start + j),
      );
      const target = c.start + (unfinished < 0 ? 0 : unfinished);
      return `<a class="chapter-row" href="#${available ? "practice/" + target : "course"}" ${available ? "" : 'aria-label="' + esc(c.title) + ' — complete the previous chapter to unlock"'}><span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${c.title}</h3><code>${c.commands}</code><small>${done === c.missions.length ? "COMPLETE ✓" : available ? done + " / " + c.missions.length + " missions" : c.missions.length + " missions · LOCKED"}</small><span>${available ? "↗" : "—"}</span></a>`;
    })
    .join("");
}
function stats() {
  return `<div class="stats"><div class="stat"><strong>${state.completed.length}<span style="display:inline"> / ${missions.length}</span></strong><span>MISSIONS COMPLETE</span></div><div class="stat"><strong>${streak()} days</strong><span>LEARNING STREAK</span></div><div class="stat"><strong>${Math.floor(state.seconds / 60)} min</strong><span>ACTIVE PRACTICE</span></div><div class="stat"><strong>${Math.round((state.completed.length / missions.length) * 100)}%</strong><span>COURSE PROGRESS</span></div></div>`;
}
// Examples run in a throwaway shell; they cannot complete or alter practice.
function workedExample(mission) {
  const demo = new Shell();
  demo.cwd = mission.example.start;
  Object.assign(demo.fs, mission.files || {});
  return `<section class="worked-example" aria-label="Worked example"><span class="eyebrow">HOW TO USE IT</span><div class="syntax"><span>Syntax</span><code>${esc(mission.example.syntax)}</code></div><p class="micro">EXAMPLE · STARTING IN ${esc(demo.cwd)}</p>${mission.example.steps
    .map((step) => {
      const prompt = demo.cwd.replace(HOME, "~");
      const result = demo.run(step.command);
      const resultText = [result.stdout.trimEnd(), result.stderr.trimEnd()]
        .filter(Boolean)
        .join("\n");
      const transcript = `${prompt} $ ${step.command}${resultText ? "\n" + resultText : ""}`;
      return `<div class="example-step"><span class="sr-only">${esc(transcript)}</span><div class="example-frame" aria-hidden="true"><pre class="example-measure">${esc(transcript)}</pre><pre class="example-live"><span class="dim">${esc(prompt)} $ </span><span class="green example-command">${esc(step.command)}</span><span class="example-cursor" hidden>▌</span><span class="example-result">${resultText ? "\n" + esc(resultText) : ""}</span></pre></div><p>${esc(step.explanation)}</p></div>`;
    })
    .join(
      "",
    )}<div class="example-controls"><button type="button" class="textbtn example-replay">Replay example ↺</button><button type="button" class="textbtn example-finish">Show full example</button><span class="micro example-status" role="status" aria-live="polite"></span></div><span class="micro">These examples leave your practice workspace unchanged.</span></section>`;
}
function render() {
  disposeExample();
  record();
  const route = location.hash.slice(1);
  current = -1;
  document.querySelector("#resume").href = "#practice/" + Math.max(0, next());
  if (route === "course") {
    app.innerHTML = `<div class="wrap"><div class="courseintro"><div><span class="eyebrow">YOUR FIELD GUIDE</span><h1>A little practice.<br>A whole new skill.</h1><p class="intro">Seven chapters. Work at your own pace.<br>Every chapter ends with a real challenge.</p></div><a class="btn" href="#practice/${Math.max(0, next())}">${next() < 0 ? "Revisit the course" : "Continue learning"} ↗</a></div>${stats()}<div class="section-head"><h2>The learning path</h2><span class="micro">${storageOK ? "PROGRESS SAVED ON THIS DEVICE" : "STORAGE UNAVAILABLE — PROGRESS IS TEMPORARY"}</span></div>${rows()}<p class="micro">Each mission starts with its own workspace. Your attempts are saved separately. No account or installation needed.</p></div>`;
    return;
  }
  if (!route.startsWith("practice/")) {
    app.innerHTML = landing;
    app.querySelector(".chapter-row").outerHTML = rows();
    return;
  }
  const id = Number(route.split("/")[1]);
  if (!Number.isInteger(id) || !missions[id] || !unlocked(id)) {
    location.hash = "course";
    return;
  }
  current = id;
  const m = missions[id],
    c = chapters[m.chapter],
    saved = state.sessions[id];
  shell = new Shell(saved);
  if (!saved?.fs) {
    shell.cwd = m.start || HOME;
    Object.assign(shell.fs, m.files || {});
  }
  events = saved?.events || [];
  history = saved?.history || [];
  historyIndex = history.length;
  app.innerHTML = `<div class="workspace"><aside class="sidebar"><div class="eyebrow">THE FIELD GUIDE</div><a href="#course" class="missionlink">← Course overview</a><div class="progress" role="progressbar" aria-label="Course completion" aria-valuenow="${state.completed.length}" aria-valuemin="0" aria-valuemax="${missions.length}"><div style="width:${(state.completed.length / missions.length) * 100}%"></div></div><span class="micro" id="progress-count">${state.completed.length} / ${missions.length} missions complete</span>${chapters
    .map(
      (c, ci) =>
        `<div class="sidechapter">${String(ci + 1).padStart(2, "0")} / ${c.title.toUpperCase()}</div>${
          ci === m.chapter
            ? c.missions
                .map((mm, j) => {
                  const n = c.start + j;
                  return unlocked(n)
                    ? `<a class="missionlink ${n === id ? "active" : ""}" href="#practice/${n}" ${n === id ? 'aria-current="page"' : ""}><span>${state.completed.includes(n) ? "✓" : mm.challenge ? "◇" : "·"}</span>${mm.title}</a>`
                    : `<span class="missionlink locked" data-mission="${n}"><span>—</span>${mm.title}</span>`;
                })
                .join("")
            : `<a class="missionlink" href="#${unlocked(c.start) ? "practice/" + c.start : "course"}">${unlocked(c.start) ? "Open chapter ↗" : "Complete earlier missions"}</a>`
        }`,
    )
    .join(
      "",
    )}</aside><section class="lesson"><span class="eyebrow">CHAPTER ${String(m.chapter + 1).padStart(2, "0")} / MISSION ${m.index + 1} OF ${c.missions.length}</span><h2>${m.title}</h2>${m.challenge ? '<span class="pill">CHAPTER CHALLENGE</span>' : ""}<p>${m.lesson}</p>${workedExample(m)}<div class="goal"><span class="eyebrow">NOW YOU TRY</span><p>${m.goal}</p></div><div id="feedback" aria-live="polite"></div><button class="btn" id="check">Check my work <span>↗</span></button><button class="btn secondary" id="hint">Get a hint <span>+</span></button><div id="hints" class="hint" aria-live="polite"></div><p class="micro">Explore freely. Checks look at your results.<br>Need a fresh start? Reset this workspace.</p></section><section class="practice"><div class="terminal"><div class="termbar"><span class="dots">● ● ●</span><span>student@prompt-lab</span><span>SIMULATED SHELL</span></div><div class="output" id="output" role="log" aria-label="Terminal output"></div><form class="commandline" id="terminal-form"><label for="command" class="green" id="prompt">$</label><input id="command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command" placeholder="Type a command…"></form></div><div class="toolbar"><span class="micro">ENTER to run · ↑↓ history · TAB complete</span><button class="textbtn" id="reset">Reset workspace ↺</button></div><details><summary>Command reference</summary><pre>pwd                    Show your current directory
ls [path]              List files and directories
cd path                Change location (.. = parent, ~ = home)
touch file             Create an empty file
cat file               Print file contents
cp [-r] source dest    Copy a file or directory
mv source dest         Move or rename
rm [-r] path           Remove a file or directory
mkdir [-p] path        Create a directory
head / tail -n N file  First / last N lines
wc -l file             Count newline characters
sort file              Sort lines alphabetically
uniq file              Remove adjacent duplicate lines
grep pattern file      Print matching lines
echo text              Print text
*  ?  [abc]            Match filenames
>  >>  <  2>           Redirect output, append, input, errors
command | command      Pass output to the next command</pre></details><details><summary>Your virtual filesystem</summary><pre id="tree"></pre></details><p class="micro">${storageOK ? "Saved on this browser. Your real files stay untouched." : "Browser storage unavailable. Keep this tab open to retain progress."}</p></section></div>`;
  document.querySelector("#terminal-form").onsubmit = (e) => {
    e.preventDefault();
    runCommand(document.querySelector("#command").value);
    document.querySelector("#command").value = "";
  };
  document.querySelector("#check").onclick = () => check(true);
  document.querySelector("#hint").onclick = hint;
  document.querySelector("#reset").onclick = () => {
    if (
      confirm(
        "Reset this mission’s files, terminal, and hints? Completed progress will be kept.",
      )
    ) {
      delete state.sessions[id];
      shell = null;
      save();
      render();
    }
  };
  document.querySelector("#command").onkeydown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      historyIndex = Math.max(
        0,
        Math.min(history.length, historyIndex + (e.key === "ArrowUp" ? -1 : 1)),
      );
      e.target.value = history[historyIndex] || "";
    }
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      document.querySelector("#output").innerHTML = "";
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const v = e.target.value,
        last = v.split(/\s/).at(-1),
        p = resolve(last || ".", shell.cwd);
      const matches = Object.keys(shell.fs).filter(
        (x) =>
          x.startsWith(p) &&
          x !== p &&
          (!last ? x.slice(shell.cwd.length + 1).indexOf("/") < 0 : true),
      );
      if (matches.length === 1) {
        let name = last.startsWith("/")
          ? matches[0]
          : matches[0].slice(shell.cwd.length + 1);
        if (shell.fs[matches[0]] === null) name += "/";
        e.target.value = v.slice(0, v.length - last.length) + name;
      } else if (matches.length > 1)
        log(matches.map((x) => x.split("/").at(-1)).join("  "));
    }
  };
  log(
    "Prompt Lab — your safe practice terminal.\nType help to see available commands.",
  );
  if (saved?.transcript)
    for (const row of saved.transcript) log(row.text, row.cls, false);
  updateTerminal();
  showHints();
  disposeExample = mountExample(document.querySelector(".worked-example"));
  if (state.completed.includes(id)) showSuccess();
}
function log(text, cls = "", persist = false) {
  const el = document.createElement("p");
  el.className = cls;
  el.textContent = text;
  const out = document.querySelector("#output");
  out.append(el);
  out.scrollTop = out.scrollHeight;
  if (persist) {
    state.sessions[current] ??= {};
    const t = (state.sessions[current].transcript ??= []);
    t.push({ text, cls });
    if (t.length > 150) t.shift();
  }
}
function updateTerminal() {
  document.querySelector("#prompt").textContent =
    shell.cwd.replace(HOME, "~") + " $";
  document.querySelector("#tree").textContent = Object.keys(shell.fs)
    .filter((p) => p.startsWith(HOME))
    .sort()
    .map((p) => p.replace(HOME, "~") + (shell.fs[p] === null ? "/" : ""))
    .join("\n");
}
function runCommand(line) {
  if (typeof line !== "string" || !line.trim()) return;
  if (line.length > 4000) throw Error("Command too long");
  log(shell.cwd.replace(HOME, "~") + " $ " + line, "green", true);
  history.push(line);
  history = history.slice(-100);
  historyIndex = history.length;
  const result = shell.run(line);
  events.push(...result.events);
  events = events.slice(-300);
  shell.events = events;
  if (line.trim() === "clear") document.querySelector("#output").innerHTML = "";
  if (result.stdout) log(result.stdout, "", true);
  if (result.stderr) log(result.stderr, "error", true);
  updateTerminal();
  record();
  check(false);
  return result;
}
function showSuccess() {
  const last = current === missions.length - 1;
  const complete = next() < 0;
  const target = last ? "course" : "practice/" + (current + 1);
  const message = complete
    ? "You’ve built a strong foundation. Revisit any mission to keep practicing."
    : last
      ? "Your handoff is ready. There are still earlier missions to explore."
      : missions[current].challenge
        ? "Chapter complete. Your next chapter is unlocked."
        : "One more command in your toolkit.";
  document.querySelector("#feedback").innerHTML =
    `<div class="success"><strong>✓ ${complete ? "Course complete. Nicely done." : "Mission complete."}</strong><br><span>${message}</span><a class="btn" href="#${target}">${last ? "View your progress" : "Next mission"} ↗</a></div>`;
}
function check(manual) {
  shell.events = events;
  if (missions[current].check(shell)) {
    if (!state.completed.includes(current)) {
      state.completed.push(current);
      const progress = document.querySelector("[role=progressbar]");
      progress.setAttribute("aria-valuenow", state.completed.length);
      progress.firstElementChild.style.width =
        (state.completed.length / missions.length) * 100 + "%";
      document.querySelector("#progress-count").textContent =
        state.completed.length + " / " + missions.length + " missions complete";
      document.querySelector(".missionlink.active span").textContent = "✓";
      if (!state.days.includes(day())) state.days.push(day());
      save();
      document.querySelector("#resume").href =
        "#practice/" + Math.max(0, next());
      const following = document.querySelector(
        `.missionlink.locked[data-mission="${current + 1}"]`,
      );
      if (following) {
        const a = document.createElement("a");
        a.className = "missionlink";
        a.href = "#practice/" + (current + 1);
        a.textContent = "· " + missions[current + 1]?.title;
        following.replaceWith(a);
      }
    }
    showSuccess();
    return true;
  }
  if (manual)
    document.querySelector("#feedback").innerHTML =
      '<p class="error">Not quite yet. Check the goal and your file paths, or try a hint.</p>';
  return false;
}
function hint() {
  state.sessions[current] ??= {};
  state.sessions[current].hint = Math.min(
    3,
    (state.sessions[current].hint || 0) + 1,
  );
  save();
  showHints();
}
function showHints() {
  const n = state.sessions[current]?.hint || 0;
  document.querySelector("#hints").innerHTML = missions[current].hints
    .slice(0, n)
    .map(
      (h, i) =>
        `<div><span class="micro">${["01 / A NUDGE", "02 / A DIRECTION", "03 / ONE SOLUTION"][i]}</span><pre>${esc(h)}</pre></div>`,
    )
    .join("");
  document.querySelector("#hint").disabled = n === 3;
  document.querySelector("#hint").innerHTML =
    n === 3
      ? "All hints revealed"
      : `Get ${n ? "another" : "a"} hint <span>${n}/3</span>`;
}
let activity = Date.now();
document.addEventListener("keydown", () => (activity = Date.now()));
document.addEventListener("pointerdown", () => (activity = Date.now()));
setInterval(() => {
  if (current >= 0 && !document.hidden && Date.now() - activity < 60000) {
    state.seconds += 5;
    save();
  }
}, 5000);
addEventListener("hashchange", render);
addEventListener("pageshow", (event) => {
  if (event.persisted) render();
});
addEventListener("pagehide", () => {
  record();
  disposeExample();
});
render();
// Optional agent interface shares the exact UI action and persistence path.
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(
      document.modelContext.registerTool({
        name: "run_practice_command",
        description:
          "Execute a simulated shell command in the currently open mission and update the visible terminal.",
        inputSchema: {
          type: "object",
          properties: { command: { type: "string", maxLength: 4000 } },
          required: ["command"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: (input) => {
          if (current < 0) throw Error("Open a mission first");
          if (
            !input ||
            typeof input.command !== "string" ||
            !input.command.trim() ||
            input.command.length > 4000
          )
            throw Error(
              "A nonempty command of at most 4000 characters is required",
            );
          const r = runCommand(input.command);
          return {
            stdout: r.stdout,
            stderr: r.stderr,
            complete: state.completed.includes(current),
          };
        },
      }),
    ).catch(() => {});
  } catch {}
}
