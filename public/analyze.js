// P6: the server returns an object, and this page uses its values:
//   sentiment -> the label and its colour, score -> the stars, summary -> the text.
// You do not need to change this file. Your work is analyze() in llm.js.

const form = document.querySelector("#analyze-form");
const textInput = document.querySelector("#text");
const sendButton = document.querySelector("#send");
const statusEl = document.querySelector("#status");
const resultEl = document.querySelector("#result");
const badgeEl = document.querySelector("#badge");
const starsEl = document.querySelector("#stars");
const summaryEl = document.querySelector("#summary");

const LABELS = { positive: "Positive", negative: "Negative", neutral: "Neutral" };

async function analyzeServer(text) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const started = Date.now();
  sendButton.disabled = true;
  statusEl.classList.remove("error");
  statusEl.textContent = "Analyzing...";
  resultEl.hidden = true;
  summaryEl.textContent = "";

  try {
    const { sentiment, score, summary } = await analyzeServer(textInput.value);
    // The values decide what the page looks like. This only works because they are data.
    badgeEl.textContent = LABELS[sentiment] ?? "?";
    badgeEl.className = sentiment in LABELS ? sentiment : "";
    starsEl.textContent = "★".repeat(score) + "☆".repeat(5 - score);
    summaryEl.textContent = summary;
    resultEl.hidden = false;
    statusEl.textContent = `Answered in ${((Date.now() - started) / 1000).toFixed(1)} s.`;
  } catch (err) {
    statusEl.textContent = `Could not analyze (${err.message}).`;
    statusEl.classList.add("error");
  } finally {
    sendButton.disabled = false;
  }
});
