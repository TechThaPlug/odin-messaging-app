
const API = "/api";

async function authRequest(endpoint, data) {
  const response = await fetch(`${API}/auth/${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

const registerForm = document.querySelector("#registerForm");
const loginForm = document.querySelector("#loginForm");

async function submitAuth(form, endpoint) {
  const message = document.querySelector("#authMessage");
  const button = form.querySelector("button");

  message.textContent = "";
  button.disabled = true;

  const data = Object.fromEntries(new FormData(form));

  try {
    await authRequest(endpoint, data);
    window.location.href = "chat.html";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", event => {
    event.preventDefault();
    submitAuth(registerForm, "register");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    submitAuth(loginForm, "login");
  });
}