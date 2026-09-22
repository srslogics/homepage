(() => {
  const $ = (id) => document.getElementById(id);
  const log = $("chat-log");
  if (!log) return;
  const root = new URL("../../", document.currentScript.src);
  const topics = {
    start: { title: "I have a software idea", text: "Choose one real task the first version should make easier, then follow it from start to finish: who starts it, what information they enter, who checks it, and what happens next. For example, an expense request might move from staff entry to manager approval to accounts recording payment.\n\nThat is a suggested discovery approach, not a fixed product. Describe your own task and where it gets difficult; the brief can capture it while live chat is unavailable.", path: "services/", link: "Explore our services" },
    work: { title: "Show me your work", text: "KNP Signature, deployed for KNP Enterprises, connects retail billing, stock, payments, and party ledgers. Royal Celebration Console, deployed for Royal Celebrations, connects enquiries and bookings with hotel stays, vendors, and collections.\n\nLakshya Institute's deployed platform gives management, students, parents, faculty, and attendance staff separate applications around shared institutional records. OctoMinds Preschool's seven-centre ERP is in development. These show different kinds of connected workflows; we consider requirements across industries.", path: "projects/", link: "Explore projects and screenshots" },
    approach: { title: "How do you work?", text: "1. Understand the work: review a real process, its users, current tools, and exceptions.\n2. Agree the first release: define what it covers, who can do what, and how you will check it works.\n3. Review working milestones: inspect actual user flows as the software develops.\n4. Test and hand over: validate agreed workflows, document deployment, transfer access, and define support.\n\nImplementation support and training help the team adopt the system. Shubham confirms the project scope and commitments.", path: "process/", link: "See the delivery process" },
    pricing: { title: "What about cost and timing?", text: "The estimate changes with the number of workflows, user permissions, existing data to migrate, integrations, and hosting requirements. A first release covering one approval process is a different scope from a platform connecting several departments.\n\nThe public process guide says focused systems may reach production review in 4 to 6 weeks; larger platforms use staged releases. This is indicative, not a promise for your project. Prices and support terms are confirmed after reviewing your requirements.", path: "pricing/", link: "Read published pricing guidance" }
  };
  let live = false;
  let connecting = false;
  let endpoint;
  let history = [];
  let expandedHistory = false;
  let controller;
  let generation = 0;
  const initial = log.firstElementChild.cloneNode(true);

  function message(text, user = false, source = null) {
    const item = document.createElement("article");
    item.className = "assistant-message" + (user ? " is-user" : "");
    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = user ? "You" : live ? "S9S Logics / AI assistant" : "S9S Logics / Project guide";
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
    if (live && !user && !source) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "assistant-text-button";
      copy.textContent = "Copy reply";
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = "Copied";
        } catch {
          $("assistant-status").textContent = "Copying is unavailable. Select the reply text to copy it manually.";
        }
      });
      item.append(copy);
    }
    log.append(item);
    while (log.children.length > 24) log.firstElementChild.remove();
    // Keep the start of a detailed answer visible instead of jumping to its end.
    log.scrollTop += item.getBoundingClientRect().top - log.getBoundingClientRect().top - 16;
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
    if (text.length > 1500) {
      $("assistant-status").textContent = "Please keep each message within 1,500 characters.";
      return;
    }
    const turn = generation;
    controller = new AbortController();
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 25000);
    // Older deployments still require short history entries until the service updates.
    const messages = [...history, { role: "user", content: text }].map((item) => ({
      role: item.role,
      content: !expandedHistory && item.role === "assistant" ? item.content.slice(0, 1500) : item.content
    }));
    let trimmed = false;
    while (messages.length > (expandedHistory ? 17 : 11) || messages.reduce((n, item) => n + item.content.length, 0) > (expandedHistory ? 16000 : 8000)) {
      // Prefer the opening exchange, but never discard the immediately preceding answer.
      messages.splice(messages.length > 5 ? 2 : 0, 2);
      trimmed = true;
    }
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
      history = [...messages, { role: "assistant", content: result.reply }];
      $("chat-input").value = "";
      $("assistant-status").textContent = trimmed
        ? "Some older exchanges no longer fit in this conversation. Restate any earlier detail that still matters."
        : "You can ask for more detail, compare approaches, or request a project outline.";
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
    $("brief-output").value = "Project enquiry for S9S Logics\n\n" + fields.map(([label, id]) => `${label}:\n${$(id).value.trim() || "To discuss"}`).join("\n\n");
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
      expandedHistory = health.conversationVersion === 2;
      $("assistant-mode").textContent = "AI assistant / not a live team member";
      $("chat-form").hidden = false;
      $("assistant-status").textContent = "AI replies use approved public company information. Agree below before sending a message.";
      initial.querySelector(".message-author").textContent = "S9S Logics / AI assistant";
      initial.querySelector("p").textContent = "Tell me what you want to build, or describe a task that is difficult today. I can help map the workflow, suggest a first release, and explain relevant S9S Logics projects. A rough idea is enough to begin.";
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
