(() => {
  const $ = (id) => document.getElementById(id);
  const log = $("chat-log");
  if (!log) return;
  const root = new URL("../../", document.currentScript.src);
  const topics = {
    start: { title: "I have a software idea", text: "Start with the outcome: what should the software make possible, and who will use it? SrS Logics builds around client requirements, not a fixed industry template. Use the brief alongside this conversation to capture your goal, current approach, and priorities.", path: "services/", link: "Explore our services" },
    work: { title: "Show me your work", text: "Public examples include deployed systems for KNP Enterprises, Royal Celebrations, and Lakshya Institute. OctoMinds Preschool's multi-centre ERP is in development, not a completed deployment. These are examples of our work, not a limit on the industries we work with.", path: "projects/", link: "View client systems and their status" },
    approach: { title: "How do you work?", text: "SrS Logics starts by understanding your goals, the people using the software, and the work it needs to support. Scope and priorities are agreed before delivery. Implementation, training, and adoption matter alongside the software itself. Shubham Singh is the founder; this guide is not Shubham or a live team member.", path: "about/", link: "Read our story" },
    pricing: { title: "What about cost and timing?", text: "A useful estimate needs a clear scope: users, features, integrations, existing data, and delivery priorities. This assistant cannot quote a price or promise a launch date. Prepare a brief, then discuss it with Shubham for a project-specific review.", path: "process/", link: "See how a project begins" }
  };
  let live = false;
  let connecting = false;
  let endpoint;
  let history = [];
  let controller;
  let generation = 0;
  const initial = log.firstElementChild.cloneNode(true);

  function message(text, user = false, source = null) {
    const item = document.createElement("article");
    item.className = "assistant-message" + (user ? " is-user" : "");
    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = user ? "You" : live ? "SrS Logics / AI assistant" : "SrS Logics / Project guide";
    const body = document.createElement("p");
    // Treat all visitor and model content as text, never executable HTML or links.
    body.textContent = text;
    item.append(author, body);
    if (source) {
      const link = document.createElement("a");
      link.href = new URL(source.path, root).href;
      link.textContent = source.link;
      item.append(link);
    }
    log.append(item);
    while (log.children.length > 24) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  document.querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = topics[button.dataset.topic];
      if (live) {
        $("chat-input").value = topic.title;
        $("chat-input").focus();
      } else {
        message(topic.title, true);
        message(topic.text, false, topic);
      }
    });
  });

  function setBusy(busy) {
    $("chat-send").disabled = busy;
    $("chat-input").disabled = busy;
    $("chat-form").setAttribute("aria-busy", String(busy));
    document.querySelectorAll("[data-topic]").forEach((button) => { button.disabled = busy; });
  }

  $("clear-chat").addEventListener("click", () => {
    generation++;
    controller?.abort();
    history = [];
    log.replaceChildren(initial.cloneNode(true));
    $("chat-input").value = "";
    $("ai-consent").checked = false;
    setBusy(false);
    $("assistant-status").textContent = "Conversation cleared. Your brief notes have not changed.";
  });

  $("chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = $("chat-input").value.trim();
    if (!live || !text || $("chat-send").disabled || !$("ai-consent").checked) return;
    const turn = generation;
    controller = new AbortController();
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 25000);
    const messages = [...history, { role: "user", content: text }].slice(-11);
    // Retain complete recent exchanges within the service's input bound.
    while (messages.reduce((n, item) => n + item.content.length, 0) > 8000 && messages.length > 1) messages.splice(0, 2);
    message(text, true);
    setBusy(true);
    $("assistant-status").textContent = "Preparing an AI reply...";
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, consent: true, provider: "groq" }), signal: requestController.signal });
      if (!response.ok) throw new Error(response.status === 429 ? "The assistant has reached its current usage limit. Please try later or use the brief." : "The AI reply is unavailable. Your message is still in the input; retry or continue with the brief.");
      const result = await response.json();
      if (typeof result.reply !== "string" || !result.reply.trim() || result.reply.length > 6000) throw new Error("The AI reply could not be read. Please retry or use the brief.");
      if (turn !== generation) return;
      message(result.reply);
      history = [...messages, { role: "assistant", content: result.reply.slice(0, 1500) }];
      $("chat-input").value = "";
      $("assistant-status").textContent = "AI reply. Verify important details with Shubham before making decisions.";
    } catch (error) {
      if (turn === generation) $("assistant-status").textContent = error.name === "AbortError" ? "The reply took too long. Please retry or use the project brief." : error.message;
    } finally {
      clearTimeout(timeout);
      if (turn === generation) { setBusy(false); $("chat-input").focus(); }
    }
  });

  $("brief-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = [["Goal", "brief-goal"], ["People using it", "brief-users"], ["Current approach", "brief-current"], ["First-version priorities", "brief-priority"]];
    if (!$("brief-goal").value.trim()) { $("brief-goal").focus(); return; }
    $("brief-output").value = "Project enquiry for SrS Logics\n\n" + fields.map(([label, id]) => `${label}:\n${$(id).value.trim() || "To discuss"}`).join("\n\n");
    $("brief-form").hidden = true;
    $("brief-review").hidden = false;
    $("review-heading").focus();
  });
  $("edit-brief").addEventListener("click", () => {
    $("brief-form").hidden = false;
    $("brief-review").hidden = true;
    $("brief-goal").focus();
  });
  $("copy-brief").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("brief-output").value);
      $("brief-status").textContent = "Brief copied. Nothing has been sent.";
    } catch {
      $("brief-output").focus();
      $("brief-output").select();
      $("brief-status").textContent = "Automatic copying is unavailable. Your brief is selected for manual copying.";
    }
  });
  $("email-brief").addEventListener("click", () => {
    const body = $("brief-output").value;
    const url = "mailto:shubhamsingh@srslogics.com?subject=Custom%20software%20project%20enquiry&body=" + encodeURIComponent(body);
    if (url.length > 1800) {
      $("brief-status").textContent = "This brief is too long for a reliable email link. Copy it and email shubhamsingh@srslogics.com.";
      return;
    }
    window.location.href = url;
    $("brief-status").textContent = "Email draft requested. Review and send it in your email app; this website has not sent it.";
  });

  async function connect() {
    const configured = window.SRS_ASSISTANT_CONFIG?.endpoint;
    if (!configured || location.protocol === "file:" || connecting || live) return;
    try {
      endpoint = new URL(configured, location.href);
      const local = ["localhost", "127.0.0.1"].includes(endpoint.hostname) && ["localhost", "127.0.0.1"].includes(location.hostname);
      if (endpoint.protocol !== "https:" && !(local && endpoint.protocol === "http:")) return;
      connecting = true;
      $("retry-connection").hidden = true;
      $("assistant-status").textContent = "Connecting to AI. The service may take a minute to wake up; the project guide and brief are available meanwhile.";
      const response = await fetch(endpoint, { credentials: "omit", signal: AbortSignal.timeout(60000) });
      if (!response.ok) return;
      const health = await response.json();
      if (!health.enabled || health.provider !== "groq") return;
      live = true;
      $("assistant-mode").textContent = "AI assistant / not a live team member";
      $("chat-form").hidden = false;
      $("assistant-status").textContent = "AI replies use approved public company information. Agree below before sending a message.";
      initial.querySelector(".message-author").textContent = "SrS Logics / AI assistant";
      initial.querySelector("p").textContent = "Hello. I am the SrS Logics AI assistant, not Shubham. Tell me what you would like your software to do, or choose a starting question below.";
      if (log.children.length === 1) log.replaceChildren(initial.cloneNode(true));
      else message("Live AI is now available. Agree below to send a message; the curated answers above were not AI-generated.");
    } catch { /* The local project guide remains usable when the AI service is offline. */ }
    finally {
      if (connecting && !live) {
        $("assistant-status").textContent = "AI is currently unavailable. Use the curated project guide and brief, or retry the connection.";
        $("retry-connection").hidden = false;
      }
      connecting = false;
    }
  }
  $("retry-connection").addEventListener("click", connect);
  connect();
})();
