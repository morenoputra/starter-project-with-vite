import { loginUser } from "../../data/api";

export default class LoginPage {
  async render() {
    return `
      <section class="auth-container">
        <div class="auth-card">
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-sub">Login to continue to the app</p>
          <form id="login-form">
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div class="form-row">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
            <div class="form-row">
              <button type="submit" class="auth-button">Login</button>
            </div>
            <div id="login-message" role="status" aria-live="polite" class="form-message"></div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender(pageElement) {
    const form = pageElement.querySelector("#login-form");
    const messageEl = pageElement.querySelector("#login-message");

    if (!form || !messageEl) {
      console.error("Login form elements not found on the page!");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      messageEl.textContent = "";

      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;

      try {
        const res = await loginUser({ email, password });

        if (res && res.error === false && res.loginResult && res.loginResult.token) {
          localStorage.setItem("authToken", res.loginResult.token);
          if (res.loginResult.name) localStorage.setItem("authName", res.loginResult.name);
          if (res.loginResult.userId) localStorage.setItem("authUserId", res.loginResult.userId);

          messageEl.style.color = "green";
          messageEl.textContent = "Login successful. Token saved.";

          if (window.showToast) window.showToast("Login successful");
          window.dispatchEvent(new Event("authchange"));
          location.hash = "#/";
        } else {
          messageEl.style.color = "red";
          messageEl.textContent = (res && res.message) || "Login failed";
          if (window.showToast) window.showToast(messageEl.textContent);
        }
      } catch (err) {
        messageEl.style.color = "red";
        messageEl.textContent = "Login error: " + err.message;
      }
    });
  }
}
