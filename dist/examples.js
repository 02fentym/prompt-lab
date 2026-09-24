/** Animate precomputed example transcripts only. This module never runs commands
 * or touches the learner's shell. One cancellable timer belongs to each view.
 */
export function mountExample(root) {
  if (!root) return () => {};
  const steps = [...root.querySelectorAll(".example-step")].map((el) => ({
    command: el.querySelector(".example-command"),
    output: el.querySelector(".example-result"),
    cursor: el.querySelector(".example-cursor"),
    text: el.querySelector(".example-command").textContent,
  }));
  const replay = root.querySelector(".example-replay");
  const finish = root.querySelector(".example-finish");
  const status = root.querySelector(".example-status");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer,
    observer,
    disposed = false;
  const cancel = () => {
    clearTimeout(timer);
    observer?.disconnect();
  };
  const later = (fn, delay) => {
    timer = setTimeout(() => {
      if (disposed) return;
      // Do not let a background tab skip the demonstration while it is unseen.
      if (document.hidden) later(fn, 200);
      else fn();
    }, delay);
  };
  function showFull() {
    cancel();
    for (const step of steps) {
      step.command.textContent = step.text;
      step.output.style.visibility = "visible";
      step.cursor.hidden = true;
    }
    finish.disabled = true;
    status.textContent = motion.matches
      ? "Full example shown · reduced motion"
      : "Example complete";
  }
  function prepare() {
    for (const step of steps) {
      step.command.textContent = "";
      step.output.style.visibility = "hidden";
      step.cursor.hidden = true;
    }
    finish.disabled = false;
  }
  function play() {
    cancel();
    if (motion.matches) {
      showFull();
      return;
    }
    prepare();
    status.textContent = "Playing example";
    function typeStep(index) {
      if (index === steps.length) {
        showFull();
        return;
      }
      const step = steps[index];
      const letters = Array.from(step.text);
      let position = 0;
      step.cursor.hidden = false;
      function typeLetter() {
        step.command.textContent = letters.slice(0, ++position).join("");
        if (position < letters.length) later(typeLetter, 48);
        else
          later(() => {
            step.cursor.hidden = true;
            step.output.style.visibility = "visible";
            later(() => typeStep(index + 1), 1050);
          }, 400);
      }
      later(typeLetter, 300);
    }
    typeStep(0);
  }
  replay.onclick = play;
  finish.onclick = showFull;
  const onMotionChange = () => {
    if (motion.matches) showFull();
  };
  motion.addEventListener("change", onMotionChange);
  if (motion.matches) showFull();
  else if (typeof IntersectionObserver !== "undefined") {
    prepare();
    status.textContent = "Ready to play";
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) play();
      },
      { threshold: 0.15 },
    );
    observer.observe(root.querySelector(".example-frame"));
  } else play();
  return () => {
    disposed = true;
    cancel();
    motion.removeEventListener("change", onMotionChange);
    replay.onclick = null;
    finish.onclick = null;
  };
}
