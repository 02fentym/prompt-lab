import { HOME } from "./shell.js";
// Add chapters and missions here. Checks inspect actual state or structured output,
// so alternate valid command sequences work. Each mission gets a fresh sandbox.
const output = (s, c, v) =>
  s.events.some((e) => e.command === c && !e.stderr && e.stdout.trim() === v);
const has = (s, p) => s.exists(p);
const file = (s, p) => s.file(p);
const at = (p) => HOME + "/" + p;
const m = (title, lesson, goal, hints, answer, check) => ({
  title,
  lesson,
  goal,
  hints: [...hints, answer],
  answer,
  check,
});
export const chapters = [
  {
    title: "Find your bearings",
    commands: "pwd · ls · cd · paths",
    missions: [
      m(
        "You are here",
        "The terminal is a conversation: you type a command, press Enter, and read its response. <code>pwd</code> prints your working directory — your current location.",
        "Print your current location.",
        [
          "Try asking the terminal where you are.",
          "The command is short for “print working directory.”",
        ],
        "pwd",
        (s) => output(s, "pwd", HOME),
      ),
      m(
        "Look around",
        "<code>ls</code> lists the files and directories at your location. A trailing slash in this simulator marks a directory. You can also give ls a path.",
        "List the contents of your home directory.",
        [
          "You want to list, not move.",
          "Run ls from /home/student, or give it that path.",
        ],
        "ls",
        (s) =>
          s.events.some(
            (e) =>
              e.command === "ls" &&
              !e.stderr &&
              e.stdout.includes("welcome.txt") &&
              e.stdout.includes("projects/"),
          ),
      ),
      m(
        "Make a move",
        "<code>cd projects</code> changes into a directory. Relative paths start where you are; absolute paths start at <code>/</code>. <code>..</code> means the parent and <code>~</code> means home.",
        "Move into the robot directory inside projects.",
        [
          "The robot folder is inside projects.",
          "You can move two levels with one relative path.",
        ],
        "cd projects/robot",
        (s) => s.cwd === at("projects/robot"),
      ),
      m(
        "Challenge: there and back",
        "Combine navigation and inspection. You can use relative or absolute paths. Your final location matters.",
        "Read projects/robot/readme.txt, then return to your home directory.",
        [
          "cat prints a file; cd changes your location.",
          "Visit projects/robot, read readme.txt, and use cd ~.",
        ],
        "cd projects/robot\ncat readme.txt\ncd ~",
        (s) => s.cwd === HOME && output(s, "cat", "Robot club project"),
      ),
    ],
  },
  {
    title: "Make files work for you",
    commands: "touch · cat · cp · mv · rm",
    missions: [
      m(
        "Your first file",
        "<code>touch draft.txt</code> creates an empty file. <code>cat notes.txt</code> displays an existing file’s content.",
        "Create draft.txt in your home directory and read notes.txt.",
        [
          "Two commands will do it.",
          "Use touch for creation and cat for reading.",
        ],
        "touch draft.txt\ncat notes.txt",
        (s) =>
          file(s, at("draft.txt")) === "" &&
          output(s, "cat", "bring a notebook"),
      ),
      m(
        "A copy, not a replacement",
        "<code>cp source destination</code> copies a file. The original stays exactly where it is.",
        "Copy notes.txt to backup.txt in your home directory.",
        ["The source comes before the destination.", "Give cp two filenames."],
        "cp notes.txt backup.txt",
        (s) =>
          file(s, at("backup.txt")) === "bring a notebook\n" &&
          has(s, at("notes.txt")),
      ),
      m(
        "New name, same file",
        "<code>mv old new</code> renames or moves a file. <code>rm name</code> deletes one. In this simulator you can reset a mission at any time.",
        "Rename notes.txt to notebook.txt, then remove welcome.txt.",
        [
          "mv does not leave the old copy behind.",
          "Use mv, then rm on the unwanted file.",
        ],
        "mv notes.txt notebook.txt\nrm welcome.txt",
        (s) =>
          file(s, at("notebook.txt")) === "bring a notebook\n" &&
          !has(s, at("notes.txt")) &&
          !has(s, at("welcome.txt")),
      ),
      m(
        "Challenge: prepare a handoff",
        "Copying preserves an original. Moving changes its name or location. Choose the operation that leaves the right files behind.",
        "Keep notes.txt. Make a copy named handoff.txt inside projects. Delete welcome.txt.",
        [
          "Copy first, then move the copy into projects.",
          "You can also copy straight to projects/handoff.txt.",
        ],
        "cp notes.txt projects/handoff.txt\nrm welcome.txt",
        (s) =>
          file(s, at("projects/handoff.txt")) === "bring a notebook\n" &&
          has(s, at("notes.txt")) &&
          !has(s, at("welcome.txt")),
      ),
    ],
  },
  {
    title: "Build your workspace",
    commands: "mkdir · cp -r · mv · rm -r",
    missions: [
      m(
        "Room to grow",
        "<code>mkdir name</code> makes a directory. For nested directories, create the parent first or use <code>mkdir -p parent/child</code>.",
        "Create a workspace directory with a drafts directory inside it.",
        [
          "Build the outer folder, then the inner one.",
          "mkdir -p can make both in one command.",
        ],
        "mkdir -p workspace/drafts",
        (s) => file(s, at("workspace/drafts")) === null,
      ),
      m(
        "Copy the whole tree",
        "Directories can contain more directories. <code>cp -r</code> copies recursively: everything inside comes along.",
        "Make a complete copy of projects named archive in your home directory.",
        [
          "A normal cp only copies files.",
          "Add -r before the source and destination.",
        ],
        "cp -r projects archive",
        (s) =>
          file(s, at("archive/robot/readme.txt")) === "Robot club project\n" &&
          has(s, at("projects/robot/readme.txt")),
      ),
      m(
        "Move and remove",
        "<code>mv</code> moves directories too. <code>rm -r</code> removes a directory and everything inside it. Check your target first.",
        "Rename projects to workshop, then remove the data directory and its contents.",
        ["No -r is needed for mv.", "Use rm -r only for data."],
        "mv projects workshop\nrm -r data",
        (s) =>
          file(s, at("workshop/robot/readme.txt")) === "Robot club project\n" &&
          !has(s, at("projects")) &&
          !has(s, at("data")),
      ),
      m(
        "Challenge: tidy the studio",
        "Use directory creation, recursive copying, and removal to organize this workspace.",
        "Create vault. Copy the entire projects directory into vault. Remove the original projects directory.",
        [
          "Create a destination before copying into it.",
          "Your result should be vault/projects/robot/readme.txt.",
        ],
        "mkdir vault\ncp -r projects vault\nrm -r projects",
        (s) =>
          file(s, at("vault/projects/robot/readme.txt")) ===
            "Robot club project\n" && !has(s, at("projects")),
      ),
    ],
  },
  {
    title: "Think in patterns",
    commands: "* · ? · [ ]",
    missions: [
      m(
        "One pattern, many files",
        "An unquoted <code>*</code> matches zero or more characters. <code>data/*.txt</code> selects text files inside data. Wildcards select names, not file contents.",
        "Create collected, then copy every .txt file from data into it. Leave the .csv file behind.",
        [
          "Create the destination directory first.",
          "Use data/*.txt as the source for cp.",
        ],
        "mkdir collected\ncp data/*.txt collected",
        (s) =>
          ["names.txt", "log.txt", "day1.txt", "day2.txt"].every(
            (f) => file(s, at("collected/" + f)) === file(s, at("data/" + f)),
          ) && !has(s, at("collected/day3.csv")),
      ),
      m(
        "Exactly one character",
        "<code>?</code> matches exactly one character. So <code>day?.txt</code> matches day1.txt and day2.txt.",
        "Print the contents of both day text files in data.",
        [
          "cat can read more than one matched file.",
          "The pattern goes after cat.",
        ],
        "cat data/day?.txt",
        (s) => output(s, "cat", "Monday\nTuesday"),
      ),
      m(
        "A small set of choices",
        "<code>[12]</code> matches one character: 1 or 2. Ranges like <code>[1-3]</code> work too.",
        "Copy day1.txt and day2.txt into your home directory.",
        [
          "Select the day number with square brackets.",
          "The destination can be a dot, meaning here.",
        ],
        "cp data/day[12].txt .",
        (s) =>
          file(s, at("day1.txt")) === "Monday\n" &&
          file(s, at("day2.txt")) === "Tuesday\n",
      ),
      m(
        "Challenge: selective backup",
        "Use patterns to select only the files you need. Quoted wildcards are literal characters, so leave selection patterns unquoted.",
        "Create daily. Copy the two day .txt files into daily. Remove those two files from data, keeping names.txt, log.txt, and day3.csv.",
        [
          "Choose day files, not every text file.",
          "Use the same data/day[12].txt selection for cp and rm.",
        ],
        "mkdir daily\ncp data/day[12].txt daily\nrm data/day[12].txt",
        (s) =>
          ["1", "2"].every(
            (n) =>
              file(s, at("daily/day" + n + ".txt")) ===
                (n === "1" ? "Monday\n" : "Tuesday\n") &&
              !has(s, at("data/day" + n + ".txt")),
          ) &&
          ["names.txt", "log.txt", "day3.csv"].every((f) =>
            has(s, at("data/" + f)),
          ),
      ),
    ],
  },
  {
    title: "Read between the lines",
    commands: "head · tail · wc · sort · uniq · grep",
    missions: [
      m(
        "First and last",
        "<code>head -n 2 file</code> shows the first two lines. <code>tail -n 2 file</code> shows the last two. Both default to ten lines.",
        "Display the first two and last two lines of data/log.txt.",
        [
          "Run two separate commands.",
          "Give each command -n 2 and the log path.",
        ],
        "head -n 2 data/log.txt\ntail -n 2 data/log.txt",
        (s) =>
          output(s, "head", "INFO boot\nERROR sensor") &&
          output(s, "tail", "ERROR motor\nINFO done"),
      ),
      m(
        "Find the signal",
        "<code>grep ERROR file</code> prints matching lines. <code>wc -l file</code> counts newline characters; these sample files have one per line.",
        "Show only ERROR lines from data/log.txt, then count all lines in that file.",
        [
          "Filtering and counting are separate tasks here.",
          "grep chooses the lines; wc -l counts them.",
        ],
        "grep ERROR data/log.txt\nwc -l data/log.txt",
        (s) =>
          output(s, "grep", "ERROR sensor\nERROR motor") &&
          output(s, "wc", "5"),
      ),
      m(
        "Get things in order",
        "<code>sort</code> orders lines. <code>uniq</code> removes adjacent repeated lines — it does not sort for you. Later, you’ll connect them.",
        "Display data/names.txt sorted alphabetically, then display it with adjacent duplicates removed.",
        [
          "Use sort and uniq separately on the original file.",
          "Zoe appears twice because those duplicates are not adjacent.",
        ],
        "sort data/names.txt\nuniq data/names.txt",
        (s) =>
          output(s, "sort", "Ada\nAda\nMax\nZoe\nZoe") &&
          output(s, "uniq", "Zoe\nAda\nMax\nZoe"),
      ),
      m(
        "Challenge: inspect the incident",
        "Take a quick look at the boundaries of a log, then isolate the important messages.",
        "Show the first line, the last line, and all ERROR lines of data/log.txt.",
        [
          "You need three views of the same file.",
          "Use head -n 1, tail -n 1, and grep ERROR.",
        ],
        "head -n 1 data/log.txt\ntail -n 1 data/log.txt\ngrep ERROR data/log.txt",
        (s) =>
          output(s, "head", "INFO boot") &&
          output(s, "tail", "INFO done") &&
          output(s, "grep", "ERROR sensor\nERROR motor"),
      ),
    ],
  },
  {
    title: "Give output a destination",
    commands: "> · >> · < · 2>",
    missions: [
      m(
        "Save what you see",
        "<code>></code> sends normal output to a file, replacing its contents. <code>echo</code> prints text; quotation marks keep words together.",
        "Create status.txt containing exactly Ready on its own line.",
        ["Send echo’s output to a file.", "The filename belongs after >."],
        "echo Ready > status.txt",
        (s) => file(s, at("status.txt")) === "Ready\n",
      ),
      m(
        "Add without erasing",
        "<code>>></code> appends output. It keeps existing content. Compare that to <code>></code>, which replaces the file.",
        "Create journal.txt with two lines: Started, then Finished.",
        [
          "Write the first line, then append the second.",
          "Use > once and >> once.",
        ],
        "echo Started > journal.txt\necho Finished >> journal.txt",
        (s) => file(s, at("journal.txt")) === "Started\nFinished\n",
      ),
      m(
        "Input and errors",
        "<code><</code> feeds a file into a command as input. <code>2></code> sends error output to a file instead of the terminal. Normal output and errors are separate streams.",
        "Sort names using < into sorted.txt. Run cat on missing.txt and save the error to errors.txt.",
        [
          "Combine input and output redirection around sort.",
          "Use 2> on the command that will fail.",
        ],
        "sort < data/names.txt > sorted.txt\ncat missing.txt 2> errors.txt",
        (s) =>
          file(s, at("sorted.txt")) === "Ada\nAda\nMax\nZoe\nZoe\n" &&
          typeof file(s, at("errors.txt")) === "string" &&
          file(s, at("errors.txt")).includes("missing.txt"),
      ),
      m(
        "Challenge: write a report",
        "Redirected output is useful data. Build a report in stages without overwriting the earlier lines.",
        "Create report.txt with Incident report as the first line, followed by the two ERROR lines from data/log.txt.",
        [
          "Write the title first. Then append the filtered log.",
          "grep can send its output to >> too.",
        ],
        'echo "Incident report" > report.txt\ngrep ERROR data/log.txt >> report.txt',
        (s) =>
          file(s, at("report.txt")) ===
          "Incident report\nERROR sensor\nERROR motor\n",
      ),
    ],
  },
  {
    title: "Connect the dots",
    commands: "| · command pipelines",
    missions: [
      m(
        "Your first pipeline",
        "A pipe <code>|</code> sends one command’s output into the next command. No temporary file is needed. Commands in this simulator run left to right.",
        "Use a pipeline to count the ERROR lines in data/log.txt.",
        [
          "Filter first, then count the filtered lines.",
          "Pipe grep’s output into wc -l.",
        ],
        "grep ERROR data/log.txt | wc -l",
        (s) =>
          s.events.some(
            (e) => e.piped && e.command === "wc" && e.stdout.trim() === "2",
          ),
      ),
      m(
        "Sort. Simplify.",
        "Sorting puts identical lines next to each other. That makes <code>uniq</code> useful for removing every duplicate.",
        "Print an alphabetical list of unique names from data/names.txt with a pipeline.",
        [
          "sort feeds into uniq.",
          "uniq needs the sorted stream, not the original file.",
        ],
        "sort data/names.txt | uniq",
        (s) =>
          s.events.some(
            (e) =>
              e.piped && e.command === "uniq" && e.stdout === "Ada\nMax\nZoe\n",
          ),
      ),
      m(
        "Keep the result",
        "The end of a pipeline can redirect to a file. The terminal may show nothing because the output went into your file.",
        "Save the first two alphabetically sorted unique names to shortlist.txt.",
        [
          "Connect sort, uniq, then head.",
          "Use head -n 2 at the end and redirect to shortlist.txt.",
        ],
        "sort data/names.txt | uniq | head -n 2 > shortlist.txt",
        (s) => file(s, at("shortlist.txt")) === "Ada\nMax\n",
      ),
      m(
        "Final challenge: the handoff",
        "Build a useful result by combining directories, pipelines, and redirection. Use any valid sequence that produces the requested files.",
        "Create delivery. Save the alphabetical unique names to delivery/roster.txt and the number of ERROR lines to delivery/error-count.txt.",
        [
          "Think of two pipelines with separate destination files.",
          "Make delivery, then sort | uniq and grep | wc -l, each redirected.",
        ],
        "mkdir delivery\nsort data/names.txt | uniq > delivery/roster.txt\ngrep ERROR data/log.txt | wc -l > delivery/error-count.txt",
        (s) =>
          file(s, at("delivery/roster.txt")) === "Ada\nMax\nZoe\n" &&
          file(s, at("delivery/error-count.txt")) === "2\n",
      ),
    ],
  },
];

// Preserve the original order for migrating existing learners without losing work.
export const legacyMissionIds = chapters.flatMap((c) =>
  c.missions.map((m) => m.id || m.title),
);
const lesson = (
  title,
  text,
  goal,
  hints,
  answer,
  check,
  start = HOME,
  files = {},
) => ({
  ...m(title, text, goal, hints, answer, check),
  start,
  files,
});
const insertBeforeChallenge = (chapter, additions) =>
  chapter.missions.splice(chapter.missions.length - 1, 0, ...additions);
// Navigation grows from a single step to combining relative paths, then recovery.
const nav = chapters[0].missions;
nav.splice(
  2,
  0,
  lesson(
    "Inspect without moving",
    "A path after <code>ls</code> chooses what to list. It does not change your working directory. <code>.</code> means the current directory.",
    "List the contents of projects/robot while staying in your home directory.",
    [
      "Give ls a path instead of using cd.",
      "The path has two directory names joined with /.",
    ],
    "ls projects/robot",
    (s) => s.cwd === HOME && output(s, "ls", "readme.txt"),
  ),
  lesson(
    "Step into a directory",
    "<code>cd</code> means change directory. Put a space between the command and the directory name. Successful cd usually prints nothing; the prompt shows your new location.",
    "Move from home into the data directory.",
    ["Use the name of a directory you can see with ls.", "Put data after cd."],
    "cd data",
    (s) => s.cwd === at("data"),
  ),
);
nav[4].lesson =
  "A relative path starts at your current directory. Slashes join the steps: <code>projects/robot</code> means enter projects, then robot. A leading <code>./</code> explicitly means “start here” and is optional.";
insertBeforeChallenge(chapters[0], [
  lesson(
    "Go up one level",
    "<code>..</code> means the parent directory, one level above you. It is a path, so it goes after cd. It does not mean home: your parent depends on where you are.",
    "You start inside projects/robot. Move up to projects.",
    [
      "Move toward the folder that contains robot.",
      "The parent path is two dots, with no space between them.",
    ],
    "cd ..",
    (s) => s.cwd === at("projects"),
    at("projects/robot"),
  ),
  lesson(
    "Take a relative shortcut",
    "Join <code>..</code> with more path segments to go up and then down. For example, <code>../robot</code> goes to your parent and then into its robot directory. Each .. removes one level.",
    "Starting inside projects/robot, reach data without going home first. Use one relative cd path.",
    [
      "You need to climb two levels, then descend into data.",
      "Join two parent steps and data with slashes.",
    ],
    "cd ../../data",
    (s) =>
      s.cwd === at("data") &&
      s.events.filter((e) => e.command === "cd" && !e.stderr).length === 1 &&
      s.events.some(
        (e) =>
          e.command === "cd" &&
          !e.stderr &&
          e.args[0] &&
          !e.args[0].startsWith("/") &&
          !e.args[0].startsWith("~") &&
          e.cwd === at("data"),
      ),
    at("projects/robot"),
  ),
  lesson(
    "Start from the root",
    "An absolute path begins with <code>/</code>, the filesystem root. Its destination is the same from every starting directory. A path without that leading slash is relative.",
    "You start in data. Use an absolute path to reach projects/robot.",
    [
      "Start with /home/student, then add the destination.",
      "An absolute path must begin with /.",
    ],
    "cd /home/student/projects/robot",
    (s) =>
      s.cwd === at("projects/robot") &&
      s.events.some(
        (e) =>
          e.command === "cd" &&
          !e.stderr &&
          e.args[0]?.startsWith("/") &&
          e.cwd === at("projects/robot"),
      ),
    at("data"),
  ),
  lesson(
    "A shortcut home",
    "<code>~</code> stands for /home/student here. <code>cd ~</code> returns home from anywhere; <code>cd</code> with no argument does the same. <code>~/data</code> means data inside your home directory.",
    "You start in projects/robot. Return home, then move into data.",
    ["First return home, then enter data.", "cd ~ followed by cd data works."],
    "cd ~\ncd data",
    (s) =>
      s.cwd === at("data") &&
      s.events.some((e) => e.command === "cd" && !e.stderr && e.cwd === HOME),
    at("projects/robot"),
  ),
  lesson(
    "Names with spaces",
    "Spaces normally separate command arguments. Wrap a path containing spaces in quotes so it stays one argument. Directory names are case-sensitive: Art and art are different names.",
    "Move into the Art Club directory inside projects.",
    [
      "The directory name contains a space and capitals.",
      "Quote the complete path after cd.",
    ],
    'cd "projects/Art Club"',
    (s) => s.cwd === at("projects/Art Club"),
    HOME,
    { [at("projects/Art Club")]: null },
  ),
  lesson(
    "Recover from a wrong turn",
    "cd can only enter existing directories. A typo or a filename produces an error and leaves you where you were. Use ls to inspect the actual names, then try again.",
    "Try cd notes.txt and observe the error. Then enter the projects directory successfully.",
    [
      "notes.txt is a file, not a folder.",
      "After the error, cd projects is a valid move.",
    ],
    "cd notes.txt\ncd projects",
    (s) =>
      s.cwd === at("projects") &&
      s.events.some(
        (e) => e.command === "cd" && e.stderr && e.args[0] === "notes.txt",
      ),
  ),
]);
// Extra applications of copy/move: a destination can be a directory or a new name.
chapters[1].missions.splice(
  2,
  0,
  lesson(
    "Copy into another directory",
    "When the destination of cp is an existing directory, the copy keeps its original filename. The source stays in place. You can use relative or absolute paths for either argument.",
    "Copy notes.txt into projects while keeping the original.",
    [
      "Use projects as the destination.",
      "You do not need to type the filename twice.",
    ],
    "cp notes.txt projects",
    (s) =>
      file(s, at("projects/notes.txt")) === "bring a notebook\n" &&
      file(s, at("notes.txt")) === "bring a notebook\n",
  ),
);
insertBeforeChallenge(chapters[1], [
  lesson(
    "Move across directories",
    "mv can change both location and name at once. The first path identifies the source; the second identifies where it should end up. Unlike cp, mv removes the old path.",
    "Move notes.txt into projects and rename it meeting.txt in the same move.",
    [
      "Include the new name in the destination path.",
      "The destination is projects/meeting.txt.",
    ],
    "mv notes.txt projects/meeting.txt",
    (s) =>
      !has(s, at("notes.txt")) &&
      file(s, at("projects/meeting.txt")) === "bring a notebook\n",
  ),
]);
chapters[2].missions.unshift(
  lesson(
    "Make a directory",
    "mkdir creates an empty directory. Use a single name to create it here. If a parent directory is missing, create that first or use -p, which you will practice next.",
    "Create a directory called studio in your home directory.",
    [
      "This is a directory, so use mkdir rather than touch.",
      "The new name goes after mkdir.",
    ],
    "mkdir studio",
    (s) => file(s, at("studio")) === null,
  ),
);
insertBeforeChallenge(chapters[3], [
  lesson(
    "Choose a range",
    "Square brackets match one character from a set or range. <code>[1-3]</code> matches 1, 2, or 3. Wildcards may be combined: <code>day[1-3].*</code> selects all three day files regardless of extension.",
    "Print all three day files in data, including the CSV file.",
    [
      "The extension differs on the third day.",
      "Use a number range and a wildcard extension.",
    ],
    "cat data/day[1-3].*",
    (s) => output(s, "cat", "Monday\nTuesday\nWednesday"),
  ),
]);
chapters[4].missions.splice(
  0,
  0,
  lesson(
    "Read just the beginning",
    "head prints the beginning of a file. The option <code>-n</code> says how many lines to show; the number follows it. Without -n, head shows up to ten lines.",
    "Show only the first three lines of data/log.txt.",
    [
      "Choose a line count of three.",
      "Use head -n 3 followed by the file path.",
    ],
    "head -n 3 data/log.txt",
    (s) => output(s, "head", "INFO boot\nERROR sensor\nINFO ready"),
  ),
);
chapters[4].missions.splice(
  2,
  0,
  lesson(
    "Search for matching lines",
    "grep takes a pattern and then a file path. It prints each matching line in full. Matches are case-sensitive: INFO and info differ. Quote a pattern containing spaces.",
    "Print only the INFO lines from data/log.txt.",
    [
      "The pattern appears at the start of each information line.",
      "grep takes INFO first, then the log path.",
    ],
    "grep INFO data/log.txt",
    (s) => output(s, "grep", "INFO boot\nINFO ready\nINFO done"),
  ),
);
chapters[4].missions.splice(
  4,
  0,
  lesson(
    "Sort before you simplify",
    "sort prints lines in alphabetical order; it does not edit the original file. Repeated lines remain in the result. A later uniq step can remove repeats.",
    "Display data/names.txt in alphabetical order without changing the file.",
    [
      "Use sort with the names file as its argument.",
      "This task needs no redirection or deletion.",
    ],
    "sort data/names.txt",
    (s) =>
      output(s, "sort", "Ada\nAda\nMax\nZoe\nZoe") &&
      file(s, at("data/names.txt")) === "Zoe\nAda\nAda\nMax\nZoe\n",
  ),
);
chapters[5].missions.splice(
  2,
  0,
  lesson(
    "Feed a command input",
    "The <code>&lt;</code> operator supplies file contents as standard input. The command reads that stream instead of receiving a filename argument. You can use <code>&gt;</code> at the same time to save the result.",
    "Use input redirection to count lines in data/log.txt and save the result to total.txt.",
    [
      "The log goes after <; total.txt goes after >.",
      "wc -l reads from input when no filename argument is supplied.",
    ],
    "wc -l < data/log.txt > total.txt",
    (s) =>
      file(s, at("total.txt")) === "5\n" &&
      s.events.some(
        (e) =>
          e.command === "wc" &&
          e.args.length === 1 &&
          e.args[0] === "-l" &&
          e.redirected,
      ),
  ),
  lesson(
    "Catch the error stream",
    "Commands have two output streams: normal results and errors. <code>2&gt;</code> saves errors; <code>&gt;</code> saves normal output. A missing file is an easy way to see the difference.",
    "Try to read absent.txt and save the error to problems.txt.",
    [
      "Use cat with a filename that does not exist.",
      "Redirect stream 2 to problems.txt.",
    ],
    "cat absent.txt 2> problems.txt",
    (s) =>
      typeof file(s, at("problems.txt")) === "string" &&
      file(s, at("problems.txt")).includes("absent.txt"),
  ),
);
insertBeforeChallenge(chapters[6], [
  lesson(
    "Trace a longer pipeline",
    "A pipeline can have more than two stages. Read it left to right: each stage transforms the previous result. Filtering before taking the last line gives the last match, not necessarily the last line in the file.",
    "Save the last ERROR line in data/log.txt to last-error.txt using a pipeline.",
    [
      "Filter with grep, then keep one line with tail.",
      "Put tail -n 1 after the pipe and redirect at the end.",
    ],
    "grep ERROR data/log.txt | tail -n 1 > last-error.txt",
    (s) =>
      file(s, at("last-error.txt")) === "ERROR motor\n" &&
      s.events.some((e) => e.command === "tail" && e.piped && e.redirected),
  ),
]);

// Teaching examples are distinct from practice goals and run in their own sandbox.
// Tuple format: [syntax, [[command, explanation], ...], optional starting directory].
const examples = {
  "You are here": [
    "pwd",
    [
      [
        "pwd",
        "Prints the full path of the current directory. Type only pwd, not the $ prompt.",
      ],
    ],
  ],
  "Look around": [
    "ls [path]",
    [
      [
        "ls projects",
        "Lists projects without moving there. robot/ is a directory.",
      ],
      ["ls", "With no path, ls lists your current directory."],
    ],
  ],
  "Inspect without moving": [
    "ls path",
    [["ls data", "Looks inside data while the prompt stays at home."]],
  ],
  "Step into a directory": [
    "cd directory",
    [
      [
        "cd projects",
        "Changes the current directory from home to projects. No output means it succeeded.",
      ],
    ],
  ],
  "Make a move": [
    "cd parent/child",
    [
      [
        "cd ./projects/robot",
        "Starts here (.), enters projects, then robot. Each slash separates a path segment.",
      ],
    ],
  ],
  "Go up one level": [
    "cd ..",
    [["cd ..", "Starting in data, the parent directory is /home/student."]],
    at("data"),
  ],
  "Take a relative shortcut": [
    "cd ../sibling",
    [
      [
        "cd ../data",
        "Starting in projects, go up to home and then down into data.",
      ],
    ],
    at("projects"),
  ],
  "Start from the root": [
    "cd /absolute/path",
    [
      [
        "cd /home/student/data",
        "The leading slash starts at the root, regardless of where you are.",
      ],
    ],
    at("projects/robot"),
  ],
  "A shortcut home": [
    "cd ~   (return home)\ncd     (also return home)\ncd ~/path",
    [
      [
        "cd ~",
        "Returns to /home/student. cd with no argument would do the same.",
      ],
      ["cd ~/projects", "Starts at home and enters projects."],
    ],
    at("data"),
  ],
  "Names with spaces": [
    'cd "directory with spaces"',
    [
      [
        'cd "projects/Art Club"',
        "Quotes keep the space inside the name rather than separating two arguments.",
      ],
    ],
  ],
  "Recover from a wrong turn": [
    "cd directory",
    [
      [
        "cd no-such-folder",
        "The error leaves the current directory unchanged.",
      ],
      ["ls", "Look for the real directory names before trying again."],
      ["cd data", "This directory exists, so navigation succeeds."],
    ],
  ],
  "Challenge: there and back": [
    "cd path  →  cat file  →  cd ~",
    [
      ["cd data", "Enter a directory before reading a file in it."],
      [
        "cat day1.txt",
        "cat displays file contents; the file path is relative to data.",
      ],
      ["cd ~", "Return home after inspecting the file."],
    ],
  ],
  "Your first file": [
    "touch filename  ·  cat filename",
    [
      ["touch practice.txt", "Creates an empty file named practice.txt."],
      ["cat welcome.txt", "Displays the contents of an existing file."],
    ],
  ],
  "A copy, not a replacement": [
    "cp source destination",
    [
      [
        "cp welcome.txt greeting.txt",
        "Creates greeting.txt with the same content; welcome.txt stays in place.",
      ],
      ["cat greeting.txt", "Check the new copy by reading it."],
    ],
  ],
  "Copy into another directory": [
    "cp source existing-directory",
    [
      [
        "cp welcome.txt projects",
        "Creates projects/welcome.txt while preserving the original.",
      ],
    ],
  ],
  "New name, same file": [
    "mv old-name new-name  ·  rm filename",
    [
      [
        "mv welcome.txt greeting.txt",
        "Renames the file; welcome.txt no longer exists.",
      ],
      [
        "rm greeting.txt",
        "Deletes greeting.txt. The lack of output means removal succeeded.",
      ],
    ],
  ],
  "Move across directories": [
    "mv source directory/new-name",
    [
      [
        "mv welcome.txt projects/greeting.txt",
        "Changes both the location and the filename.",
      ],
    ],
  ],
  "Challenge: prepare a handoff": [
    "cp source directory/name  ·  rm filename",
    [
      [
        "cp welcome.txt projects/greeting.txt",
        "Copy directly to a new name inside another directory.",
      ],
      ["rm welcome.txt", "Remove only the original; the copy remains."],
    ],
  ],
  "Make a directory": [
    "mkdir name",
    [
      [
        "mkdir sketches",
        "Creates one empty directory in the current location.",
      ],
    ],
  ],
  "Room to grow": [
    "mkdir -p parent/child",
    [
      [
        "mkdir -p studio/sketches",
        "-p creates missing parents as well as the final directory.",
      ],
      ["ls studio", "Check that sketches exists inside studio."],
    ],
  ],
  "Copy the whole tree": [
    "cp -r source-directory destination",
    [
      [
        "cp -r data data-backup",
        "-r copies the directory and all its children to data-backup.",
      ],
    ],
  ],
  "Move and remove": [
    "mv old-directory new-directory  ·  rm -r directory",
    [
      ["mv data readings", "Renames the directory and keeps all its files."],
      ["rm -r readings", "Removes readings and everything inside it."],
    ],
  ],
  "Challenge: tidy the studio": [
    "mkdir destination  →  cp -r source destination  →  rm -r source",
    [
      ["mkdir storage", "Create a destination directory."],
      [
        "cp -r data storage",
        "Copies data as storage/data, including its files.",
      ],
      ["rm -r data", "The original is removed; storage/data remains."],
    ],
  ],
  "One pattern, many files": [
    "command directory/*.extension",
    [
      ["mkdir samples", "Make a directory to hold copies."],
      [
        "cp data/*.csv samples",
        "* matches the filename before .csv; only day3.csv matches here.",
      ],
    ],
  ],
  "Exactly one character": [
    "command prefix?.extension",
    [
      [
        "ls data/day?.txt",
        "? matches one digit in each filename; it cannot match the .csv extension.",
      ],
    ],
  ],
  "A small set of choices": [
    "command prefix[choices].extension",
    [
      [
        "ls data/day[13].*",
        "The bracket set selects day 1 or 3; * allows either extension.",
      ],
    ],
  ],
  "Choose a range": [
    "command prefix[first-last].extension",
    [["ls data/day[1-2].txt", "[1-2] matches one digit from 1 through 2."]],
  ],
  "Challenge: selective backup": [
    "cp pattern directory  →  rm pattern",
    [
      ["mkdir csv-backup", "Prepare the destination."],
      ["cp data/*.csv csv-backup", "Copies only CSV files."],
      [
        "rm data/*.csv",
        "Removes only the selected originals. Text files are untouched.",
      ],
    ],
  ],
  "Read just the beginning": [
    "head -n count file",
    [["head -n 1 data/log.txt", "-n 1 asks for just the first line."]],
  ],
  "First and last": [
    "head -n count file  ·  tail -n count file",
    [
      ["head -n 1 data/names.txt", "Read from the beginning."],
      [
        "tail -n 2 data/names.txt",
        "Read the last two lines without reversing their order.",
      ],
    ],
  ],
  "Search for matching lines": [
    "grep pattern file",
    [
      [
        'grep "INFO ready" data/log.txt',
        "The quoted pattern includes a space. grep prints the entire matching line.",
      ],
    ],
  ],
  "Find the signal": [
    "grep pattern file  ·  wc -l file",
    [
      [
        "grep Ada data/names.txt",
        "Print every matching line, including duplicates.",
      ],
      [
        "wc -l data/names.txt",
        "-l counts lines (newline characters), not matching names.",
      ],
    ],
  ],
  "Sort before you simplify": [
    "sort file",
    [
      [
        "sort data/log.txt",
        "Print the log in alphabetical order. The original file is unchanged.",
      ],
    ],
  ],
  "Get things in order": [
    "sort file  ·  uniq file",
    [
      [
        "sort data/names.txt",
        "Sorting groups identical names together but keeps duplicates.",
      ],
      [
        "uniq data/names.txt",
        "On the original input only adjacent Ada repeats disappear; separated Zoe repeats remain.",
      ],
    ],
  ],
  "Challenge: inspect the incident": [
    "head -n count file  ·  tail -n count file  ·  grep pattern file",
    [
      ["head -n 1 data/names.txt", "Inspect the beginning."],
      ["tail -n 1 data/names.txt", "Inspect the end."],
      ["grep Ada data/names.txt", "Inspect only matching lines."],
    ],
  ],
  "Save what you see": [
    "command > output-file",
    [
      [
        'echo "Hello terminal" > greeting.txt',
        "echo prints the text; > sends it into greeting.txt, replacing any old content.",
      ],
      ["cat greeting.txt", "Read the file to see where the output went."],
    ],
  ],
  "Add without erasing": [
    "command >> output-file",
    [
      [
        "echo First > demo.txt",
        "Create or replace the file with the first line.",
      ],
      [
        "echo Second >> demo.txt",
        "Append a second line rather than replacing the first.",
      ],
      ["cat demo.txt", "Both lines are still present."],
    ],
  ],
  "Feed a command input": [
    "command < input-file > output-file",
    [
      [
        "wc -l < data/names.txt > count.txt",
        "< supplies input; > stores the line count. wc receives no filename argument.",
      ],
      ["cat count.txt", "Read the saved result."],
    ],
  ],
  "Catch the error stream": [
    "command 2> error-file",
    [
      [
        "cat nonexistent.txt 2> error-demo.txt",
        "cat fails. Stream 2 goes into the file instead of appearing in the terminal.",
      ],
      [
        "cat error-demo.txt",
        "The saved text is the error message, not normal output.",
      ],
    ],
  ],
  "Input and errors": [
    "command < input > output  ·  command 2> errors",
    [
      [
        "sort < data/log.txt > ordered-log.txt",
        "Read, sort, and save a stream without changing the input file.",
      ],
      [
        "cat nonexistent.txt 2> error-demo.txt",
        "A separate command redirects errors to another file.",
      ],
    ],
  ],
  "Challenge: write a report": [
    "echo title > report  →  grep pattern file >> report",
    [
      [
        'echo "Name matches" > summary.txt',
        "Write the heading, replacing any previous report.",
      ],
      [
        "grep Ada data/names.txt >> summary.txt",
        "Append matching lines without losing the heading.",
      ],
      ["cat summary.txt", "Read the assembled report."],
    ],
  ],
  "Your first pipeline": [
    "command | next-command",
    [
      [
        "grep INFO data/log.txt | wc -l",
        "grep produces three lines. The pipe feeds those lines to wc, which prints 3.",
      ],
    ],
  ],
  "Sort. Simplify.": [
    "sort file | uniq",
    [
      [
        "sort data/log.txt | uniq",
        "Pass sorted lines into uniq. All log lines are distinct, so none disappear.",
      ],
    ],
  ],
  "Keep the result": [
    "command | command | command > file",
    [
      [
        "sort data/log.txt | head -n 2 > sample.txt",
        "Sort the stream, keep its first two lines, then write that result.",
      ],
      ["cat sample.txt", "Only the selected lines were saved."],
    ],
  ],
  "Trace a longer pipeline": [
    "filter | select > file",
    [
      [
        "grep INFO data/log.txt | tail -n 1 > last-info.txt",
        "First choose INFO lines, then keep their last line, then save it.",
      ],
      ["cat last-info.txt", "INFO done is the last information line."],
    ],
  ],
  "Final challenge: the handoff": [
    "mkdir directory  →  pipeline > directory/file",
    [
      ["mkdir analysis", "Create a directory for results."],
      [
        "grep INFO data/log.txt | wc -l > analysis/info-count.txt",
        "A pipeline can write into a directory.",
      ],
      ["cat analysis/info-count.txt", "Verify the saved count."],
    ],
  ],
};
let offset = 0;
for (const chapter of chapters) {
  chapter.start = offset;
  chapter.missions.forEach((mission, index) => {
    mission.id ??= mission.title;
    mission.challenge = index === chapter.missions.length - 1;
    const [syntax, steps, start] = examples[mission.title];
    mission.example = {
      syntax,
      steps: steps.map(([command, explanation]) => ({ command, explanation })),
      start: start || HOME,
    };
  });
  offset += chapter.missions.length;
}
export const missions = chapters.flatMap((c, chapter) =>
  c.missions.map((mission, index) => ({ ...mission, chapter, index })),
);
