# Project assistant service

The existing website stays static. This small, dependency-free Node 22+ service
is deployed separately; do not change or migrate the existing Render static site.
It serves only `/api/assistant`, never repository files or private invoice pages.

## Current state

The page points to the separate public assistant service. The browser checks its
health before enabling AI conversation; an unavailable or disabled service leaves
the curated guide and local brief builder usable. Server-side enablement requires
a Groq key, model, and allowed origins. No credentials are committed.

The assistant uses public project details and a discovery approach that answers
the visitor's question, explains a possible workflow, and scopes a first release.
Simple questions stay brief; detailed plans can use up to 500 words / 6000
characters. It can draft an outline in chat, which the visitor can copy. It does
not populate the brief form or send an enquiry automatically.

Conversation version 2 supports 17 alternating messages, 16000 total characters,
1500 characters per user message, and 6000 per assistant message. The browser
preserves recent complete turns and the opening exchange when it fits, indicates when older
turns were dropped, and clears everything on reload or Clear chat. The version is
advertised in health so a newer page still works against an older service.

## Activate after review

1. Create a separate Render Web Service from this repo with Node 22+, root directory
   `server`, no dependency installation required, and start command `node assistant.mjs`.
   Alternatively use an existing Node host. Do not publish `server/.env` as a static asset.
2. Set the variables from `.env.example` in the host's secret/environment settings.
   Start with `GROQ_MODEL=openai/gpt-oss-20b`, subject to your Groq account's model
   availability. Put the key only in `GROQ_API_KEY` on that service, never in browser
   code or chat. The model is hosted by Groq; no OpenAI API key or billing is used.
3. Before enabling, configure provider project usage limits/alerts and an edge rate
   limiter or bot challenge. Origin checks are not authentication: non-browser callers
   can forge them. The built-in 60 requests/hour and 2 concurrent requests are shared
   per process, reset on restart, and are NOT a durable cross-instance spending cap.
   Keep one instance until a shared limiter is added. Do not rely on forwarded-IP
   headers without a documented trusted proxy configuration.
4. Set `ASSISTANT_ENABLED=true` only after the above controls are ready. Confirm
   GET `/api/assistant` with the allowed Origin header returns
   a response with `enabled: true`, `provider: "groq"`, and `conversationVersion: 2`.
5. Set the public HTTPS endpoint in `assets/js/assistant-config.js` to that service's
   `/api/assistant` URL. No key belongs in this file. Push/deploy the static site only
   when approved. Verify a real consented conversation before announcing live AI.

## Local verification

Run `node --test scripts/assistant.test.mjs`. These tests use a fake provider and
never incur AI charges. For an intentional live local test, configure the secrets
in a local ignored `server/.env`, allow only the exact local preview origin, and run
`node --env-file=server/.env server/assistant.mjs` from the repository root. Set the
public config temporarily to `http://127.0.0.1:8891/api/assistant`; do not commit it.

## Data boundaries

- Knowledge is manually curated in `assistant-knowledge.mjs` from public About,
  Services, Process, Pricing, Client Systems, and case study content, reviewed
  13 September 2026. Suggestions for a new system are distinct from company facts.
  Review project statuses when the public portfolio changes. No automatic crawling,
  uploads, client-system access, private screenshots, or financial records are used.
- The browser keeps chat and brief state in memory, not cookies or local storage.
  Clear chat cancels the current request; it cannot retract data already sent.
- Consent to sharing messages with the AI provider is required before sending chat history. The linked privacy details identify Groq. The
  Responses request uses `store: false`; this is NOT a guarantee of zero provider
  retention. Provider abuse-monitoring rules and host technical logs still apply.
  Enable Zero Data Retention in Groq's Data Controls before launch and review its
  [data handling documentation](https://console.groq.com/docs/your-data).
  The browser checks the provider in the health response and the server rejects
  messages without `provider: "groq"`, preventing older consent UI from silently
  submitting conversations to a changed provider.
- The service does not intentionally persist/log message bodies. Audit hosting
  telemetry before launch to ensure it does not capture request or response bodies.
- Brief fields never go to the AI. Copy/email are explicit visitor actions. Email
  opens a draft, not an automatic lead submission. There is no CRM or booking tool.
- Model answers are rendered as text, not HTML or executable links. Instructions
  prohibit private-data claims and invented commitments but do not guarantee model
  correctness. Manually test prompt-injection attempts, unsupported company facts,
  pricing, project status, and private-data requests on the selected live model.
- Failure, timeout, disabled service, and exhausted usage leave the brief usable.

Disable immediately with `ASSISTANT_ENABLED=false`. Set the browser endpoint back
to an empty string to return to the curated guide without a health-check request.

## Enquiry-only conversations

Every turn is scoped to public S9S Logics information and prospective software
requirements across all industries. Greetings, brief contextual answers, and
project-specific explanations are allowed; general entertainment, advice,
homework, code generation, and role-override requests are redirected. Mixed
requests may receive only an answer to the legitimate enquiry portion.

The model returns a scope label and reply in a JSON envelope. The service replaces
classified off-topic output with a fixed project-enquiry redirect. Malformed
output returns a retryable 502 instead of falsely treating a legitimate project
question as off-topic. Raw invalid answers are never displayed. This uses one
provider call per turn, not a second classifier call.
Classification is model-based and is not a perfect prompt-injection barrier.
Mock tests verify the output gate, not real model classification accuracy.
After deploying, check greetings, nontechnical and multilingual enquiries,
short follow-ups, random trivia, role overrides, and mixed requests on the live
model. Off-topic attempts still use provider quota; this is not a bot limiter.

## Free-plan operation

Stay on Groq's Free plan to test without enabling paid API usage. Model quotas are
shared across the organization and can change; check the account's Limits page.
The 60 requests/hour local ceiling is not a promise that Groq permits that many
conversations: token and daily limits can be reached first. Provider HTTP 429
responses preserve the usage-limit UI and the brief remains available. There is
no automatic retry, paid-provider fallback, or plan upgrade in this code. Hosting
charges are separate. Choosing a paid Groq account can incur usage charges.

The implementation uses Groq's beta Responses API, `store: false`, a 2200-token
output ceiling, and low reasoning effort for GPT-OSS models. Longer conversations
and detailed answers use more quota than short enquiries. Only final assistant text is returned; internal
reasoning is discarded. Check these references when changing models or API fields:
- [Responses API](https://console.groq.com/docs/responses-api)
- [Free-plan limits](https://console.groq.com/docs/rate-limits)
- [Available models](https://console.groq.com/docs/models)

## Answer-quality review

The automated suite checks transport, complete conversation history, consent,
scope parsing, retry behavior, and UI interactions with a fake provider. It cannot
prove live model answer quality. Use `assistant-evaluation.md` to review the actual
model before publishing this revision. Deploy the service before or alongside the
static page; verify version 2 health and repeat the scenarios after deployment.
