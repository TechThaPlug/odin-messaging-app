
let currentUser = null;
let activeConversationId = null;
let conversations = [];
let refreshTimer = null;

const $ = selector => document.querySelector(selector);

function safeText(value) {
  return String(value ?? "");
}

function displayName(user) {
  return user.displayName || user.username || "User";
}

async function loadAccount() {
  const result = await apiRequest("/auth/me");
  currentUser = result.user || result;

  if (!currentUser || !currentUser.id) {
    window.location.href = "login.html";
    return;
  }

  $("#currentUser").textContent = `Logged in as ${displayName(currentUser)}`;
}

async function loadConversations() {
  const result = await apiRequest("/conversations");
  conversations = result.conversations || [];

  const list = $("#conversationList");
  list.replaceChildren();

  if (!conversations.length) {
    list.textContent = "No conversations yet.";
    return;
  }

  conversations.forEach(conversation => {
    const peer = conversation.participants
      ?.map(participant => participant.user)
      .find(user => user && user.id !== currentUser.id);

    const button = document.createElement("button");
    button.className = "conversation-item";
    if (conversation.id === activeConversationId) {
      button.classList.add("active");
    }

    const name = document.createElement("strong");
    name.textContent = peer ? displayName(peer) : "Conversation";

    const preview = document.createElement("span");
    preview.textContent = conversation.messages?.[0]?.content || "Start chatting";

    button.append(name, preview);
    button.addEventListener("click", () => openConversation(conversation.id));
    list.append(button);
  });
}

async function searchUsers(query) {
  const results = $("#searchResults");
  results.replaceChildren();

  if (query.trim().length < 2) return;

  try {
    const data = await apiRequest(`/users?search=${encodeURIComponent(query.trim())}`);

    if (!data.users?.length) {
      results.textContent = "No users found.";
      return;
    }

    data.users.forEach(user => {
      const button = document.createElement("button");
      button.className = "search-result";

      const name = document.createElement("strong");
      name.textContent = displayName(user);

      const username = document.createElement("span");
      username.textContent = `@${user.username}`;

      button.append(name, username);
      button.addEventListener("click", () => startConversation(user.id));
      results.append(button);
    });
  } catch (error) {
    results.textContent = error.message;
  }
}

async function startConversation(participantId) {
  try {
    const result = await apiRequest("/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId })
    });

    const conversation = result.conversation || result;
    activeConversationId = conversation.id;

    $("#userSearch").value = "";
    $("#searchResults").replaceChildren();

    await loadConversations();
    await openConversation(activeConversationId);
  } catch (error) {
    $("#chatStatus").textContent = error.message;
  }
}

async function openConversation(conversationId) {
  activeConversationId = conversationId;

  const conversation = conversations.find(item => item.id === conversationId);
  const peer = conversation?.participants
    ?.map(participant => participant.user)
    .find(user => user && user.id !== currentUser.id);

  $("#chatHeader").replaceChildren();

  const heading = document.createElement("h2");
  heading.textContent = peer ? displayName(peer) : "Conversation";

  const subtitle = document.createElement("p");
  subtitle.textContent = peer ? `@${peer.username}` : "Private conversation";

  $("#chatHeader").append(heading, subtitle);
  $("#messageInput").disabled = false;
  $("#sendBtn").disabled = false;

  await loadMessages();
  await loadConversations();
  $("#messageInput").focus();
}

async function loadMessages() {
  if (!activeConversationId) return;

  try {
    const result = await apiRequest(
      `/conversations/${activeConversationId}/messages`
    );

    const messages = result.messages || [];
    const container = $("#messages");
    container.replaceChildren();

    if (!messages.length) {
      container.textContent = "No messages yet. Say hello!";
      return;
    }

    messages.forEach(message => {
      const bubble = document.createElement("article");
      bubble.className = "message";
      if (message.senderId === currentUser.id) {
        bubble.classList.add("own-message");
      }

      const sender = document.createElement("strong");
      sender.textContent = message.senderId === currentUser.id
        ? "You"
        : displayName(message.sender || {});

      const content = document.createElement("p");
      content.textContent = message.content;

      const time = document.createElement("time");
      time.textContent = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      bubble.append(sender, content, time);
      container.append(bubble);
    });

    container.scrollTop = container.scrollHeight;
  } catch (error) {
    $("#chatStatus").textContent = error.message;
  }
}

async function sendMessage(event) {
  event.preventDefault();

  const input = $("#messageInput");
  const content = input.value.trim();

  if (!content || !activeConversationId) return;

  $("#sendBtn").disabled = true;

  try {
    await apiRequest(`/conversations/${activeConversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content })
    });

    input.value = "";
    $("#chatStatus").textContent = "";
    await loadMessages();
    await loadConversations();
  } catch (error) {
    $("#chatStatus").textContent = error.message;
  } finally {
    $("#sendBtn").disabled = false;
    input.focus();
  }
}

async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "login.html";
  }
}

$("#userSearch").addEventListener("input", event => {
  searchUsers(event.target.value);
});

$("#messageForm").addEventListener("submit", sendMessage);
$("#logoutBtn").addEventListener("click", logout);

async function initializeChat() {
  try {
    await loadAccount();
    await loadConversations();

    refreshTimer = setInterval(async () => {
      if (activeConversationId) await loadMessages();
      await loadConversations();
    }, 4000);
  } catch (error) {
    $("#chatStatus").textContent = error.message;
  }
}

initializeChat();
