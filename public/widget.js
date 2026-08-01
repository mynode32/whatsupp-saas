(function () {
  "use strict";

  var scriptEl = document.currentScript;
  var widgetKey = scriptEl.getAttribute("data-widget-key");
  if (!widgetKey) {
    console.error("[mynode widget] missing data-widget-key attribute");
    return;
  }
  var apiBase = new URL(scriptEl.src).origin;

  var visitorId = localStorage.getItem("mynode_visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("mynode_visitor_id", visitorId);
  }

  var state = { conversationId: null, lastMessageAt: null, color: "#4f46e5", open: false };

  function api(path, opts) {
    return fetch(apiBase + path, opts).then(function (r) {
      if (!r.ok) throw new Error("request failed: " + r.status);
      return r.json();
    });
  }

  // -- UI --------------------------------------------------------------
  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Open chat");
  bubble.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:9999px;border:none;cursor:pointer;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:2147483000;display:flex;align-items:center;justify-content:center;";
  bubble.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:calc(100vh - 120px);" +
    "background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;" +
    "font-family:system-ui,-apple-system,sans-serif;z-index:2147483000;";

  var header = document.createElement("div");
  header.style.cssText = "padding:14px 16px;color:#fff;font-size:14px;font-weight:600;";

  var body = document.createElement("div");
  body.style.cssText = "flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f9fafb;";

  var form = document.createElement("form");
  form.style.cssText = "display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb;";
  var input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type a message…";
  input.style.cssText = "flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:13px;outline:none;";
  var sendBtn = document.createElement("button");
  sendBtn.type = "submit";
  sendBtn.textContent = "Send";
  sendBtn.style.cssText = "border:none;border-radius:8px;padding:8px 14px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;";
  form.appendChild(input);
  form.appendChild(sendBtn);

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(form);
  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  function applyColor(color) {
    state.color = color || state.color;
    bubble.style.background = state.color;
    header.style.background = state.color;
    sendBtn.style.background = state.color;
  }
  applyColor(state.color);

  function renderMessage(msg) {
    var row = document.createElement("div");
    row.style.cssText = "display:flex;justify-content:" + (msg.direction === "outbound" ? "flex-end" : "flex-start") + ";";
    var bubbleEl = document.createElement("div");
    bubbleEl.style.cssText =
      "max-width:80%;padding:8px 12px;border-radius:14px;font-size:13px;line-height:1.4;" +
      (msg.direction === "outbound" ? "background:" + state.color + ";color:#fff;" : "background:#fff;border:1px solid #e5e7eb;color:#111;");
    bubbleEl.textContent = msg.body; // textContent only — never innerHTML for message content (XSS)
    row.appendChild(bubbleEl);
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }

  function poll() {
    if (!state.conversationId) return;
    var qs = new URLSearchParams({ widgetKey: widgetKey, visitorId: visitorId, conversationId: state.conversationId });
    if (state.lastMessageAt) qs.set("since", state.lastMessageAt);
    api("/api/widget/messages?" + qs.toString()).then(function (data) {
      (data.messages || []).forEach(function (m) {
        renderMessage(m);
        state.lastMessageAt = m.created_at;
      });
    }).catch(function () {});
  }

  function start() {
    if (state.conversationId) return;
    api("/api/widget/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetKey: widgetKey, visitorId: visitorId }),
    }).then(function (data) {
      state.conversationId = data.conversationId;
      if (data.color) applyColor(data.color);
      header.textContent = data.welcomeMessage || "Chat";
      (data.messages || []).forEach(function (m) {
        renderMessage(m);
        state.lastMessageAt = m.created_at;
      });
      setInterval(poll, 4000);
    }).catch(function () {
      header.textContent = "Chat is unavailable right now.";
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || !state.conversationId) return;
    input.value = "";
    renderMessage({ direction: "outbound", body: text });
    api("/api/widget/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetKey: widgetKey, visitorId: visitorId, conversationId: state.conversationId, body: text }),
    }).then(function (data) {
      state.lastMessageAt = data.createdAt;
    }).catch(function () {});
  });

  bubble.addEventListener("click", function () {
    state.open = !state.open;
    panel.style.display = state.open ? "flex" : "none";
    if (state.open) start();
  });
})();
