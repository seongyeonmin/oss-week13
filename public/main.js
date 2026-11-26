// The page talks only to our own server (/api/ask).
// It never sees the LLM provider's address or the key.

const form = document.querySelector("#ask-form");
const questionInput = document.querySelector("#question");
const sendButton = document.querySelector("#send");
const statusEl = document.querySelector("#status");
const answerEl = document.querySelector("#answer");

async function askServer(question) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data.answer;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const started = Date.now();
  sendButton.disabled = true; // one question at a time
  statusEl.classList.remove("error");
  statusEl.textContent = "Asking... (this takes a few seconds)";
  answerEl.textContent = "";

  try {
    const answer = await askServer(questionInput.value);
    // Text written by a model: treat it like text from a stranger. Never innerHTML.
    answerEl.textContent = answer;
    statusEl.textContent = `Answered in ${((Date.now() - started) / 1000).toFixed(1)} s.`;
  } catch (err) {
    statusEl.textContent = `Could not get an answer (${err.message}).`;
    statusEl.classList.add("error");
  } finally {
    sendButton.disabled = false;
  }
});
