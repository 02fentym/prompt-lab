# Prompt Lab

A free browser-based command-line course: 7 sequential chapters, 46 missions, and 7 capstone challenges. No application server, account, runtime package dependency, or real shell is involved.

## Open in VS Code

Open this folder using File > Open Folder in VS Code.

Use Terminal > Run Task > Start Prompt Lab to start the local server, then visit http://127.0.0.1:4173. Stop the server with Ctrl+C. Python 3 is required; no npm install is needed. Alternatively, run the command below in VS Code's terminal.

This is an independent local copy. It includes the latest local edits (the removed landing-page hero and AY Jackson Computer Science 2026 footer). It is not connected to Sites publishing or the original project's Git repository.

## Run or host

Serve the `dist/` directory with any static host. For local development, run `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`, then open http://localhost:4173. ES modules require HTTP rather than opening index.html as a file. Fonts use Google Fonts with local fallbacks; terminal functionality has no external dependency once assets load.

## Project map

- `dist/index.html`: document, navigation, metadata, and favicon.
- `dist/style.css`: ink/lime theme, Space Grotesk and IBM Plex Mono typography, responsive layouts, accessible focus states, reduced-motion support.
- `dist/app.js`: hash routes (`#`, `#course`, `#practice/0`), terminal UI, hints, local persistence, completion and optional WebMCP interface.
- `dist/shell.js`: path normalization, virtual filesystem, quote-aware tokenizer, wildcard expansion, redirects, pipelines, and command handlers. No eval, subprocesses, or host filesystem access.
- `dist/course.js`: lesson content, worked examples, hints, solutions, per-mission setup, and semantic checks.
- `dist/examples.js`: viewport-triggered command typing and delayed result reveal, replay/skip controls, reduced-motion support, and cancellable view lifecycle. Examples never execute against student state.
- `dist/progress.js`: progress migration across curriculum changes.
- `work/test.mjs`: executable mission and shell regression checks (`node work/test.mjs`, Node 23+).

## Extend the course

Add a chapter entry to `chapters` in course.js or insert a mission in an existing chapter. Chapters have variable lengths; navigation, progress totals, and chapter challenges use the actual lesson count. The final mission in each chapter is its challenge.

Each mission has a stable `id` (currently its original title), instructional HTML (trusted authored content), a goal, two hints, a full-answer command sequence, and a check function. Add a matching entry to `examples`: syntax plus command/explanation pairs, with an optional starting directory. Examples execute in a throwaway shell to display authentic results; they never change the learner’s files or complete a mission. Mission `start` and `files` fields can create a focused setup, such as starting deep inside a directory tree.

Checks inspect filesystem contents or structured command output rather than literal command strings. Path-form requirements may inspect parsed arguments when teaching relative versus absolute paths. Use absolute paths rooted at HOME in state checks. Mission events accumulate separately per mission across commands and reloads.

`progress.js` maps saved indexes through stable mission identities. Keep a mission’s id unchanged when rewriting its title, and retain `legacyMissionIds` for original v1 learners. The current identity order is saved with progress so inserting or reordering lessons preserves completion and attempted work. New lessons remain incomplete. Earlier accessible lessons stay available when a returning learner has completed a later chapter.

## State and scope

Each mission begins with an independent seeded filesystem and saves its own attempt (filesystem, cwd, transcript, history, observed results, hints). Global completion, active practice seconds, and daily completion dates are stored under `prompt-lab-v1` in localStorage. Progress is per browser profile/device, with no cloud sync or student accounts. Streaks count consecutive local calendar days with mission completions. Practice time pauses in a hidden tab or after 60 seconds without interaction. Clearing browser storage clears progress. Storage errors leave a usable temporary in-memory session.

The simulator implements the course's command subset, not full POSIX/Bash. Supported flags are listed in the in-app reference. No scripting, substitutions, variables, background jobs, permissions model, links, or network commands are provided. Grep uses JavaScript regular expressions. `wc` counts newline characters, whitespace-delimited words, and UTF-8 bytes. `uniq` removes adjacent repeats. Protected root/home directories cannot be removed. Error redirection and pipelines preserve separate stdout/stderr streams.

## Validation performed

All 46 supplied mission solutions and worked examples pass; no mission passes its untouched initial state. Checks also cover variable chapter lengths and idempotent progress migration from the original 28-mission course. Regression cases cover quoted operators, wildcard selection, pipelines, overwrite/append, error output, malformed input, recursive copy requirements, and zero-line tail. Browser checks cover first-mission completion, progressive hints, saved-state reload, and valid/invalid WebMCP calls.

The dist directory can be served by any static web host. Local progress is separate from the published site because browser storage is scoped to the site origin.

Example animation regression checks: `node work/examples-test.mjs`. Covers typing order, output timing, replay, skip, hidden-tab pause, reduced motion, and cleanup.
