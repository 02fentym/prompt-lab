/** Deliberately simulated shell: never evals input or accesses the host filesystem.
 * Flat absolute-path map: null = directory, string = file contents.
 * Parsing preserves quoted wildcard literals. Validators consume structured events.
 */
export const HOME = "/home/student";
export function seed() {
  return {
    "/": null,
    "/home": null,
    [HOME]: null,
    [HOME + "/projects"]: null,
    [HOME + "/projects/robot"]: null,
    [HOME + "/projects/robot/readme.txt"]: "Robot club project\n",
    [HOME + "/notes.txt"]: "bring a notebook\n",
    [HOME + "/welcome.txt"]: "You don’t need to be an expert to begin.\n",
    [HOME + "/data"]: null,
    [HOME + "/data/names.txt"]: "Zoe\nAda\nAda\nMax\nZoe\n",
    [HOME + "/data/log.txt"]:
      "INFO boot\nERROR sensor\nINFO ready\nERROR motor\nINFO done\n",
    [HOME + "/data/day1.txt"]: "Monday\n",
    [HOME + "/data/day2.txt"]: "Tuesday\n",
    [HOME + "/data/day3.csv"]: "Wednesday\n",
  };
}
export function resolve(p, cwd = HOME) {
  const parts = (
    p.startsWith("/")
      ? p
      : p === "~" || p.startsWith("~/")
        ? HOME + p.slice(1)
        : cwd + "/" + p
  ).split("/");
  const out = [];
  for (const x of parts) {
    if (!x || x === ".") continue;
    if (x === "..") out.pop();
    else out.push(x);
  }
  return "/" + out.join("/");
}
const parent = (p) => p.slice(0, p.lastIndexOf("/")) || "/";
export class Shell {
  constructor(saved) {
    this.fs = saved?.fs ?? seed();
    this.cwd = saved?.cwd ?? HOME;
    this.events = [];
  }
  exists(p) {
    return Object.hasOwn(this.fs, resolve(p, this.cwd));
  }
  file(p) {
    return this.fs[resolve(p, this.cwd)];
  }
  children(p) {
    return Object.keys(this.fs)
      .filter((k) => k !== "/" && parent(k) === p)
      .sort();
  }
  write(p, s, append = false) {
    if (this.fs[parent(p)] !== null)
      throw Error(`${parent(p)}: directory not found`);
    if (this.fs[p] === null) throw Error(`${p}: is a directory`);
    this.fs[p] = (append ? (this.fs[p] ?? "") : "") + s;
  }
  tokenize(line) {
    const t = [];
    let s = "",
      quote = "",
      literal = false,
      active = false;
    const flush = () => {
      if (active) t.push({ s, literal });
      s = "";
      literal = false;
      active = false;
    };
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) {
        if (c === quote) quote = "";
        else if (c === "\\" && quote === '"' && i + 1 < line.length)
          s += line[++i];
        else s += c;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        literal = true;
        active = true;
      } else if (c === "\\") {
        if (i + 1 >= line.length) throw Error("Incomplete escape");
        s += line[++i];
        literal = true;
        active = true;
      } else if (/\s/.test(c)) flush();
      else if (
        "|<>".includes(c) ||
        (c === "2" && !active && line[i + 1] === ">")
      ) {
        flush();
        let op = c;
        if (c === "2") {
          op = "2>";
          i++;
        } else if (c === ">" && line[i + 1] === ">") {
          op = ">>";
          i++;
        }
        t.push({ s: op, op: true });
      } else {
        s += c;
        active = true;
      }
    }
    if (quote) throw Error("Unclosed quote");
    flush();
    return t;
  }
  glob(word) {
    if (!/[?*[]/.test(word)) return [word];
    const abs = resolve(word, this.cwd);
    let rx = "^";
    for (let i = 0; i < abs.length; i++) {
      let c = abs[i];
      if (c === "*") rx += "[^/]*";
      else if (c === "?") rx += "[^/]";
      else if (c === "[") {
        const j = abs.indexOf("]", i + 1);
        if (j > i) {
          let v = abs.slice(i + 1, j);
          if (v[0] === "!") v = "^" + v.slice(1);
          rx += "[" + v + "]";
          i = j;
        } else rx += "\\[";
      } else rx += c.replace(/[.\\+^$(){}|\]]/g, "\\$&");
    }
    let re;
    try {
      re = new RegExp(rx + "$");
    } catch {
      throw Error("Invalid wildcard pattern");
    }
    const matches = Object.keys(this.fs)
      .filter((k) => re.test(k))
      .sort();
    return matches.length ? matches : [word];
  }
  run(line) {
    this.events = [];
    let stdout = "",
      stderr = "";
    try {
      const tokens = this.tokenize(line);
      if (!tokens.length) return { stdout, stderr, events: [] };
      const stages = [[]];
      for (const t of tokens) {
        if (t.op && t.s === "|") stages.push([]);
        else stages.at(-1).push(t);
      }
      if (stages.some((s) => !s.length))
        throw Error("A pipe needs a command on both sides");
      let input = "";
      for (const stage of stages) {
        let out = null,
          err = null,
          append = false;
        const words = [];
        for (let i = 0; i < stage.length; i++) {
          const t = stage[i];
          if (t.op) {
            const target = stage[++i];
            if (!target || target.op)
              throw Error("Redirection needs a file path");
            const p = resolve(target.s, this.cwd);
            if (t.s === "<") {
              if (typeof this.fs[p] !== "string")
                throw Error(`${target.s}: file not found`);
              input = this.fs[p];
            } else if (t.s === "2>") err = p;
            else {
              out = p;
              append = t.s === ">>";
            }
          } else words.push(...(t.literal ? [t.s] : this.glob(t.s)));
        }
        if (!words.length) throw Error("Expected a command");
        let result;
        try {
          result = this.command(words, input);
        } catch (e) {
          result = { stdout: "", stderr: e.message + "\n" };
        }
        this.events.push({
          command: words[0],
          args: words.slice(1),
          stdout: result.stdout,
          stderr: result.stderr,
          cwd: this.cwd,
          piped: stages.length > 1,
          redirected: out !== null,
        });
        if (err) this.write(err, result.stderr);
        else stderr += result.stderr;
        if (out) {
          this.write(out, result.stdout, append);
          input = "";
        } else input = result.stdout;
      }
      stdout = input;
    } catch (e) {
      stderr += e.message + "\n";
    }
    return { stdout, stderr, events: this.events };
  }
  command([cmd, ...args], input) {
    let stdout = "",
      stderr = "";
    const emit = (s) => (stdout += s);
    const fail = (s) => (stderr += `${cmd}: ${s}\n`);
    const path = (a) => resolve(a, this.cwd);
    const need = (n) => {
      if (args.length < n) throw Error(`${cmd}: missing operand`);
    };
    const read = (a) => {
      const p = path(a);
      if (typeof this.fs[p] !== "string")
        throw Error(
          `${a}: ${this.fs[p] === null ? "is a directory" : "file not found"}`,
        );
      return this.fs[p];
    };
    if (cmd === "pwd") emit(this.cwd + "\n");
    else if (cmd === "ls") {
      const targets = args.filter((a) => !a.startsWith("-"));
      for (const a of targets.length ? targets : ["."]) {
        const p = path(a);
        if (!this.exists(p)) {
          fail(`${a}: not found`);
          continue;
        }
        emit(
          this.fs[p] === null
            ? this.children(p)
                .filter(
                  (k) =>
                    args.includes("-a") || !k.split("/").at(-1).startsWith("."),
                )
                .map(
                  (k) => k.split("/").at(-1) + (this.fs[k] === null ? "/" : ""),
                )
                .join("  ") + "\n"
            : p.split("/").at(-1) + "\n",
        );
      }
    } else if (cmd === "cd") {
      const p = path(args[0] ?? "~");
      if (this.fs[p] !== null) throw Error(`${args[0]}: directory not found`);
      this.cwd = p;
    } else if (cmd === "echo") emit(args.join(" ") + "\n");
    else if (cmd === "touch") {
      need(1);
      for (const a of args) {
        const p = path(a);
        if (!this.exists(p)) this.write(p, "");
      }
    } else if (cmd === "mkdir") {
      need(1);
      const recursive = args.includes("-p");
      for (const a of args.filter((a) => a !== "-p")) {
        const p = path(a);
        if (this.exists(p)) {
          if (!recursive || this.fs[p] !== null) fail(`${a}: already exists`);
          continue;
        }
        if (recursive) {
          let cur = "";
          for (const seg of p.split("/").filter(Boolean)) {
            cur += "/" + seg;
            if (this.exists(cur) && this.fs[cur] !== null)
              throw Error(`${cur}: not a directory`);
            this.fs[cur] = null;
          }
        } else {
          if (this.fs[parent(p)] !== null) {
            fail(`${a}: parent directory not found`);
            continue;
          }
          this.fs[p] = null;
        }
      }
    } else if (cmd === "cp" || cmd === "mv") {
      const recursive = args.includes("-r") || args.includes("-R");
      args = args.filter((a) => a !== "-r" && a !== "-R");
      need(2);
      const dest = path(args.at(-1));
      if (args.length > 2 && this.fs[dest] !== null)
        throw Error("Multiple sources require a directory");
      for (const a of args.slice(0, -1)) {
        const src = path(a);
        if (!this.exists(src)) {
          fail(`${a}: not found`);
          continue;
        }
        const target =
          this.fs[dest] === null ? dest + "/" + src.split("/").at(-1) : dest;
        if (src === target) {
          fail("source and destination are the same");
          continue;
        }
        if (target.startsWith(src + "/")) {
          fail("cannot put a directory inside itself");
          continue;
        }
        if (this.fs[src] === null && cmd === "cp" && !recursive) {
          fail(`${a}: use -r to copy a directory`);
          continue;
        }
        if (this.fs[parent(target)] !== null) {
          fail("destination parent not found");
          continue;
        }
        if (this.exists(target) && this.fs[target] === null) {
          fail("destination directory already exists");
          continue;
        }
        if (this.fs[src] === null && this.exists(target)) {
          fail("cannot replace a file with a directory");
          continue;
        }
        const keys = Object.keys(this.fs).filter(
          (k) => k === src || k.startsWith(src + "/"),
        );
        for (const k of keys)
          this.fs[target + k.slice(src.length)] = this.fs[k];
        if (cmd === "mv") for (const k of keys) delete this.fs[k];
      }
    } else if (cmd === "rm") {
      const recursive = args.includes("-r") || args.includes("-rf");
      args = args.filter((a) => a !== "-r" && a !== "-rf");
      need(1);
      for (const a of args) {
        const p = path(a);
        if (!this.exists(p)) {
          fail(`${a}: not found`);
          continue;
        }
        if (p === "/" || p === "/home" || p === HOME) {
          fail("protected learning directory");
          continue;
        }
        if (this.fs[p] === null && !recursive) {
          fail(`${a}: is a directory; use -r`);
          continue;
        }
        for (const k of Object.keys(this.fs))
          if (k === p || k.startsWith(p + "/")) delete this.fs[k];
      }
    } else if (
      ["cat", "head", "tail", "wc", "sort", "uniq", "grep"].includes(cmd)
    ) {
      let count = 10,
        pattern,
        number = false;
      const files = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if ((cmd === "head" || cmd === "tail") && a === "-n") {
          count = Number(args[++i]);
          if (!Number.isInteger(count) || count < 0)
            throw Error("Invalid line count");
        } else if (cmd === "wc" && a === "-l") number = true;
        else if (cmd === "grep" && pattern === undefined) pattern = a;
        else files.push(a);
      }
      if (cmd === "grep" && pattern === undefined)
        throw Error("grep: provide a pattern");
      let source = input;
      for (const f of files) {
        try {
          source += (files.indexOf(f) === 0 ? "" : "") + read(f);
        } catch (e) {
          fail(e.message);
        }
      }
      const lines = source ? source.replace(/\n$/, "").split("\n") : [];
      if (cmd === "cat") emit(source);
      if (cmd === "head")
        emit(
          lines.slice(0, count).join("\n") +
            (Math.min(lines.length, count) ? "\n" : ""),
        );
      if (cmd === "tail")
        emit(
          (count ? lines.slice(-count) : []).join("\n") +
            (Math.min(lines.length, count) ? "\n" : ""),
        );
      if (cmd === "sort")
        emit(lines.sort().join("\n") + (lines.length ? "\n" : ""));
      if (cmd === "uniq")
        emit(
          lines.filter((s, i) => !i || s !== lines[i - 1]).join("\n") +
            (lines.length ? "\n" : ""),
        );
      if (cmd === "grep") {
        let re;
        try {
          re = new RegExp(pattern);
        } catch {
          throw Error("grep: invalid pattern");
        }
        const found = lines.filter((s) => re.test(s));
        emit(found.join("\n") + (found.length ? "\n" : ""));
      }
      if (cmd === "wc") {
        const l = (source.match(/\n/g) || []).length,
          w = source.trim() ? source.trim().split(/\s+/).length : 0;
        emit(
          (number
            ? String(l)
            : `${l} ${w} ${new TextEncoder().encode(source).length}`) + "\n",
        );
      }
    } else if (cmd === "clear") {
    } else if (cmd === "help")
      emit(
        "pwd  ls [-a]  cd  touch  cat  cp [-r]  mv  rm [-r]\nmkdir [-p]  head [-n N]  tail [-n N]  wc [-l]\nsort  uniq  grep PATTERN  echo  clear  help\nOperators: |  >  >>  <  2>   Wildcards: * ? []\nUse ↑/↓ for history, Tab to complete paths, Ctrl+L to clear.\nThis learning shell supports the commands above, not full Bash.\n",
      );
    else
      throw Error(
        `${cmd}: command not found. Type help for supported commands.`,
      );
    return { stdout, stderr };
  }
}
