import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { instructions } from "./assistant-knowledge.mjs";

const MAX_BODY = 24000;
const MAX_INPUT = 8000;

export function validatePayload(body) {
  if (body?.consent !== true || body.provider !== "groq" || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 11 || body.messages.length % 2 !== 1) return false;
  let length = 0;
  for (const [index, message] of body.messages.entries()) {
    if (!message || message.role !== (index % 2 === 0 ? "user" : "assistant") || typeof message.content !== "string" || !message.content.trim() || message.content.length > 1500) return false;
    length += message.content.length;
  }
  return length <= MAX_INPUT;
}

export function createAssistantServer({ env = process.env, request = fetch, now = Date.now } = {}) {
  const origins = new Set((env.ASSISTANT_ALLOWED_ORIGINS || "").split(",").map((x) => x.trim()).filter(Boolean));
  const enabled = env.ASSISTANT_ENABLED === "true" && !!env.GROQ_API_KEY && !!env.GROQ_MODEL && origins.size > 0;
  const health = { enabled, provider: "groq" };
  const configuredLimit = Number(env.ASSISTANT_HOURLY_LIMIT || 60);
  if (!Number.isSafeInteger(configuredLimit) || configuredLimit < 1 || configuredLimit > 1000) throw new Error("ASSISTANT_HOURLY_LIMIT must be an integer from 1 to 1000.");
  let windowStart = now();
  let requests = 0;
  let active = 0;

  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Vary", "Origin");
    const send = (status, data) => { if (!res.destroyed) { res.writeHead(status); res.end(JSON.stringify(data)); } };
    if (req.url !== "/api/assistant") return send(404, { error: "Not found" });
    const origin = req.headers.origin;
    if (req.method === "GET" && !origin) return send(200, health);
    if (!origins.has(origin)) return send(403, { error: "Origin not allowed" });
    res.setHeader("Access-Control-Allow-Origin", origin);
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.writeHead(204); res.end(); return;
    }
    if (req.method === "GET") return send(200, health);
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST, OPTIONS"); return send(405, { error: "Method not allowed" }); }
    if (!enabled) return send(503, { error: "AI is not connected. Use the project brief." });
    if (req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") return send(415, { error: "JSON required" });
    if (Number(req.headers["content-length"]) > MAX_BODY) return send(413, { error: "Message too large" });
    let payload;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BODY) { send(413, { error: "Message too large" }); req.destroy(); return; }
        chunks.push(chunk);
      }
      payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch { return send(400, { error: "Invalid JSON" }); }
    if (!validatePayload(payload)) return send(400, { error: "Invalid conversation or missing consent" });
    // Global per-process ceiling also limits callers forging Origin headers.
    // Use an edge rate limiter and provider project limits before public launch.
    if (now() - windowStart >= 3600000) { windowStart = now(); requests = 0; }
    if (requests >= configuredLimit || active >= 2) {
      res.setHeader("Retry-After", "60");
      return send(429, { error: "Usage limit reached. Please use the project brief." });
    }
    requests++;
    active++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const disconnected = () => { if (!res.writableEnded) controller.abort(); };
    res.on("close", disconnected);
    try {
      const response = await request("https://api.groq.com/openai/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.GROQ_MODEL, instructions,
          input: payload.messages.map(({ role, content }) => ({ role, content })),
          store: false, max_output_tokens: 1200,
          ...(env.GROQ_MODEL.startsWith("openai/gpt-oss-") ? { reasoning: { effort: "low" } } : {})
        }),
        signal: controller.signal
      });
      if (response.status === 429) {
        res.setHeader("Retry-After", "60");
        return send(429, { error: "AI usage limit reached. Please try later or use the project brief." });
      }
      if (!response.ok) return send(502, { error: "AI reply unavailable. Please use the project brief." });
      const result = await response.json();
      if (result.status !== "completed") return send(502, { error: "AI reply incomplete. Please try again." });
      const reply = result.output?.filter((item) => item.type === "message" && item.role === "assistant")
        .flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text).join("\n");
      if (!reply?.trim() || reply.length > 6000) return send(502, { error: "AI reply unavailable" });
      send(200, { reply });
    } catch {
      // Never log conversation text, credentials, or raw provider errors.
      send(502, { error: "AI reply unavailable. Please try later or use the project brief." });
    } finally { clearTimeout(timeout); res.off("close", disconnected); active--; }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8891);
  createAssistantServer().listen(port, () => process.stdout.write(`Assistant service listening on port ${port}\n`));
}
