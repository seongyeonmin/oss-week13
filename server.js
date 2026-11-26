// Ask Once: the page sends a question to this server,
// and this server asks the LLM. The key never leaves this side.
// You do not need to change this file. Your work is in llm.js (and two lines of public/chat.js in P5).

import express from "express";
import * as llm from "./llm.js";

const app = express();
const port = process.env.PORT ?? 3000;

for (const name of ["LLM_BASE_URL", "LLM_MODEL", "LLM_API_KEY"]) {
  if (!process.env[name]) {
    console.error(`${name} is not set. Check your .env file (P2).`);
    process.exit(1);
  }
}

// The free service is often busy and answers 429 ("too many requests").
// That is not our bug, so wait a moment and try again, up to 4 times in all.
async function withRetry(callLlm, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await callLlm();
    } catch (err) {
      if (attempt >= tries || !err.message.includes("429")) throw err;
      console.log(`LLM is busy (429). Trying again... (${attempt}/${tries - 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

app.use(express.static("public"));
app.use(express.json());

// POST /api/ask  { "question": "..." }  ->  { "answer": "..." }
app.post("/api/ask", async (req, res) => {
  const question = req.body?.question;
  if (typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "question is required" });
  }
  if (question.length > 500) {
    return res.status(400).json({ error: "question is too long (max 500)" });
  }

  try {
    const answer = await withRetry(() => llm.ask(question.trim()));
    res.json({ answer });
  } catch (err) {
    console.error("ask failed:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// POST /api/chat  { "messages": [{ "role": "user", "content": "..." }, ...] }  ->  { "answer": "..." }
// The page sends the whole conversation every time. The model remembers nothing by itself.
app.post("/api/chat", async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }
  // Never trust what the page sends: keep only user/assistant text, and not too much of it.
  // A "system" message from the page is dropped here. The rules live in llm.js.
  const history = messages
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (history.length === 0 || history.at(-1).role !== "user") {
    return res.status(400).json({ error: "the last message must be from the user" });
  }
  if (typeof llm.chat !== "function") {
    return res.status(502).json({ error: "chat() is not written yet" });
  }

  try {
    const answer = await withRetry(() => llm.chat(history));
    res.json({ answer });
  } catch (err) {
    console.error("chat failed:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// POST /api/analyze  { "text": "..." }  ->  { "sentiment": "...", "score": 4, "summary": "..." }
// Here the answer is not a sentence for a person. It is data for our code.
app.post("/api/analyze", async (req, res) => {
  const text = req.body?.text;
  if (typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: "text is too long (max 500)" });
  }
  if (typeof llm.analyze !== "function") {
    return res.status(502).json({ error: "analyze() is not written yet" });
  }

  try {
    const result = await withRetry(() => llm.analyze(text.trim()));
    if (result === null || typeof result !== "object") {
      throw new Error(result === undefined ? "analyze() returned nothing" : "analyze() must return an object");
    }
    res.json(result);
  } catch (err) {
    console.error("analyze failed:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.listen(port, (error) => {
  if (error) throw error; // e.g. the port is already in use
  console.log(`Listening on http://localhost:${port}`);
});
