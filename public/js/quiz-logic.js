/*  quiz-logic.js  — multiple-choice vocabulary drill  */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeKey(k) {
  // optional: map F/G/H/J key presses to A/B/C/D
  const map = { F: "A", G: "B", H: "C", J: "D" };
  return (map[k] || k).toUpperCase();
}

// ---------------- DOM shortcuts ----------------
const $ = (id) => document.getElementById(id);
const loader      = $("loader");
const fileInput   = $("fileInput");
const quizCard    = $("quizCard");
const questionEl  = $("questionText");
const choicesEl   = $("choices");
const feedbackEl  = $("feedback");
const progressEl  = $("progress");
const countdownEl = $("countdown");
// -----------------------------------------------

// quiz state
let queue = [];        // questions still to ask
let current = null;    // current card
let total = 0;         // total # of original questions
let correctCount = 0;  // mastered cards
let timerId = null;
let timeLeft = 10;

// ------- timer helpers -------
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}
function stopTimer() { clearInterval(timerId); }
function startTimer(onExpire) {
  timeLeft = 10;
  countdownEl.textContent = fmt(timeLeft);
  timerId = setInterval(() => {
    timeLeft--;
    countdownEl.textContent = fmt(timeLeft);
    if (timeLeft <= 0) { clearInterval(timerId); onExpire(); }
  }, 1000);
}
// -----------------------------

function endSession(msg) {
  stopTimer();
  quizCard.innerHTML = `
    <p class="text-2xl font-bold mb-4">${msg}</p>
    <p>You answered ${correctCount} / ${total} correctly.</p>`;
}

function renderCard(resetTimer = false) {
  if (resetTimer) { stopTimer(); startTimer(() => endSession("Time's up! ⏰")); }

  feedbackEl.textContent = "";
  progressEl.textContent = `${total - queue.length}/${total}`;
  questionEl.textContent = current.q;
  choicesEl.innerHTML = "";

  current.choices.forEach((choice, idx) => {
    const letter = String.fromCharCode(65 + idx); // A,B,C,D
    const opt = document.createElement("label");
    opt.className = "flex items-center space-x-2";
    opt.innerHTML = `
      <input type="radio" name="choice"
             value="${letter}" class="h-4 w-4"
             onchange="handleSelect(this)">
      <span>${choice}</span>`;
    choicesEl.appendChild(opt);
  });
}

function handleSelect(inputEl) {
  const letter = inputEl.value;
  if (letter === current.correct) {
    feedbackEl.textContent = "Correct ✔️";
    feedbackEl.classList.replace("text-red-600", "text-green-600");
    correctCount++;
  } else {
    feedbackEl.textContent = `Wrong ❌  (Answer: ${current.correct})`;
    feedbackEl.classList.replace("text-green-600", "text-red-600");
    queue.splice(2, 0, current); // ask again soon
  }
  setTimeout(nextQuestion, 800);
}

function nextQuestion() {
  stopTimer();
  if (queue.length === 0) {
    endSession("🎉 Session complete!");
    return;
  }
  current = queue.shift();
  renderCard(true);
}

// -------------- CSV upload --------------
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      queue = results.data.map((r) => ({
        q: r.Question,
        choices: [r.ChoiceA, r.ChoiceB, r.ChoiceC, r.ChoiceD],
        correct: normalizeKey((r.Correct || "").trim())
      }));
      queue = shuffle(queue);
      total = queue.length;
      correctCount = 0;

      loader.classList.add("hidden");
      quizCard.classList.remove("hidden");
      nextQuestion();
    }
  });
});
