# P2. 키를 `.env` 에 넣고 curl 로 한 번 불러 보기

코드를 쓰기 전에, 키가 동작하는지 **curl 한 줄**로 먼저 확인합니다. 11주차에 내 서버를 curl 로 불러 본 것과 같습니다. 이번에는 상대가 LLM 이고, 요청에 키가 들어갑니다.

이 문제의 명령은 **Git Bash**(Windows) 또는 macOS 터미널 기준입니다. VS Code 터미널 패널 오른쪽 위 `+` 옆의 `v` 에서 **Git Bash** 를 고릅니다. PowerShell 에서는 3번의 `source` 가 동작하지 않습니다.

## 키 넣기 (VS Code)

1. `.env.example` 을 복사해 `.env` 를 만듭니다.
   ```
   cp .env.example .env
   ```
2. `.env` 를 열어 셋째 줄의 `=` 뒤에 P1 에서 발급한 키를 붙이고 저장합니다. 따옴표와 공백은 넣지 않습니다.
   ```
   LLM_BASE_URL=https://api.exaone.ai/v1
   LLM_MODEL=k-exaone_v2.5
   LLM_API_KEY=여기에_키
   ```
3. **확인**: 아래를 실행해 `.env` 가 목록에 **나오지 않으면** 됩니다(보통은 아무것도 출력되지 않습니다). `.gitignore` 에 `.env` 가 들어 있어서 Git 이 이 파일을 보지 않습니다.
   ```
   git status --short
   ```

## 터미널에 값 올리기 (Git Bash)

4. `.env` 의 세 값을 지금 터미널의 변수로 읽어 들입니다.
   ```
   source .env
   ```
5. **확인**: 키의 **글자 수**만 찍어 봅니다. `0` 이 아닌 숫자가 나오면 됩니다. 키 자체는 화면에 찍지 않습니다.
   ```
   echo ${#LLM_API_KEY}
   ```
   `0` 이면 `.env` 를 저장하지 않았거나 다른 폴더에서 실행한 것입니다. 터미널을 새로 열면 4번을 다시 해야 합니다.

## 한 번 불러 보기 (Git Bash)

6. 아래를 그대로 붙여 실행합니다. 네 줄이 한 명령입니다.
   ```
   curl -sS "$LLM_BASE_URL/chat/completions" \
     -H "Authorization: Bearer $LLM_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "k-exaone_v2.5", "messages": [{"role": "user", "content": "Say hello in one sentence."}]}'
   ```
   - 첫 줄: 어디로 보내는지. `-d` 가 있으면 curl 은 `POST` 로 보냅니다.
   - 둘째 줄: **키**. `Authorization` 헤더에 `Bearer ` 를 붙여 넣습니다.
   - 넷째 줄: 보내는 내용. 어느 모델에게(`model`), 무슨 말을(`messages`) 하는지입니다.
7. **확인**: 몇 초 뒤 `{"id":"...` 로 시작하는 긴 JSON 한 덩어리가 나오면 됩니다. 그 안에서 아래 세 가지를 찾습니다.

   | 찾을 것 | 뜻 |
   |---|---|
   | `"content":"\n\nHello! ..."` | 모델의 답. 앞에 `\n\n` 이 붙어 옵니다 |
   | `"reasoning_content":"..."` | 답하기 전에 모델이 한 생각. 이 모델은 항상 먼저 생각하고 답합니다 |
   | `"usage":{... "total_tokens":54 ...}` | 이번 요청에 쓴 토큰 수. 숫자는 매번 다릅니다 |

8. 같은 명령을 한 번 더 실행합니다(위쪽 화살표 키). `content` 의 문장이 첫 번째와 같은지 봅니다. 같은 질문에도 답은 달라질 수 있습니다.

## 잘 안 될 때

| 화면에 나온 것 | 원인과 조치 |
|---|---|
| `"message":"invalid api key format"` | 키가 비었거나 잘못 붙음 → 5번으로 글자 수 확인. `.env` 를 고쳤으면 4번을 다시 실행 |
| `"type":"rate_limit_error"` 와 `service is busy, too many concurrent requests` | 내 잘못이 아니라 서비스 전체가 바쁜 것 → 몇 초 뒤 다시 실행 |
| `"type":"rate_limit_error"` 와 `called 1 times per second` | 1초에 한 번보다 빨리 불렀음 → 잠깐 뒤 다시 실행 |
| `curl: (3)` 으로 시작하는 오류. 뒤 문구는 curl 버전마다 다름(`URL rejected: No host part in the URL`, `URL rejected: Malformed input to a URL function`, `URL using bad/illegal format or missing URL`) | `LLM_BASE_URL` 이 비어 있음 → 4번을 다시 실행. 그래도 같으면 `.env` 의 줄 끝이 CRLF 인 것(이때 5번의 글자 수는 0 이 아니라서 통과함) → VS Code 오른쪽 아래 `CRLF` 를 눌러 `LF` 로 바꾸고 저장한 뒤 4번을 다시 실행 |
| 4번에서 `.env: line 3: ...: command not found` | `=` 뒤에 공백이나 따옴표를 넣음 → `LLM_API_KEY=키` 처럼 붙여 쓰고 저장한 뒤 4번을 다시 실행 |
| 30초가 넘도록 아무것도 안 나옴 | 서버가 느린 때가 있습니다 → `Ctrl+C` 후 다시 실행 |
| `Invoke-WebRequest : ...` | PowerShell 에서 실행함 → Git Bash 터미널로 바꿈 |

커밋할 것은 없습니다. `.env` 는 올리지 않습니다.

---

[← 문제 목록](../README.md#문제) · [이전: P1](P1_key.md) · [다음: P3](P3_ask.md)
