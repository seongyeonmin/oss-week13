// The only file that talks to the LLM provider.
// The provider, the model and the key come from .env:
//   process.env.LLM_BASE_URL, process.env.LLM_MODEL, process.env.LLM_API_KEY

// TODO P4: make a constant SYSTEM here: the rules for every answer (tone, length, format).
//          Then send it as the first message, before the user's message, in ask().
const SYSTEM = `
존댓말인 해요체로 답하세요.
줄바꿈 없이 한 문단으로, 세 문장 이내로 답하세요.
목록, 제목, 굵은 글씨 등 마크다운을 사용하지 마세요.
`;
// ask("a question")  ->  the model's answer, as a string
export async function ask(question) {
  // TODO P3: write this function (see problems/P3_ask.md). Delete the throw line below.
  const res = await fetch(
    `${process.env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: question }
        ]
      })
    }
  );

  if (!res.ok) {
    throw new Error(`LLM: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// chat([{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...])
//   ->  the model's next answer, as a string
export async function chat(history) {
  const res = await fetch(
    `${process.env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          ...history
        ]
      })
    }
  );

  if (!res.ok) {
    throw new Error(`LLM: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// JSON analysis has its own rules, separate from the conversational SYSTEM.
const SYSTEM_JSON = `
제품 후기를 분석하고 마크다운이나 부가 설명 없이 JSON 객체로만 답하세요.
키는 정확히 sentiment, score, summary 세 개만 사용하세요.
sentiment는 "positive", "negative", "neutral" 중 하나인 문자열이어야 해요.
score는 후기의 만족도를 나타내는 1 이상 5 이하의 정수여야 해요.
summary는 후기를 요약한 짧은 한국어 한 문장인 문자열이어야 해요.
`;

// analyze("a review")  ->  an object, not a sentence:
//   { sentiment: "positive" | "negative" | "neutral", score: 1..5, summary: "one short sentence" }
export async function analyze(text) {
  const res = await fetch(
    `${process.env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_JSON },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      })
    }
  );

  if (!res.ok) {
    throw new Error(`LLM: HTTP ${res.status}`);
  }

  const data = await res.json();
  const result = JSON.parse(data.choices[0].message.content);
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("LLM: the answer has the wrong shape");
  }

  const { sentiment, score, summary } = result;
  if (
    !["positive", "negative", "neutral"].includes(sentiment) ||
    !Number.isInteger(score) || score < 1 || score > 5 ||
    typeof summary !== "string"
  ) {
    throw new Error("LLM: the answer has the wrong shape");
  }

  return { sentiment, score, summary };
}
