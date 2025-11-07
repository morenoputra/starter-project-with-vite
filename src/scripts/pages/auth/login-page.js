// pages/auth/login-page.js
import { loginUser } from "../../data/api";

export default class LoginPage {
  async render() {
    // Check if already logged in
    const token = localStorage.getItem("authToken");
    if (token) {
      window.location.hash = "#/map";
      return '<div>Redirecting to map...</div>';
    }

    return `
      <section class="auth-container">
        <div class="auth-card">
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-sub">Login to continue to the app</p>
          <form id="login-form">
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required autocomplete="email" />
            </div>
            <div class="form-row">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" required autocomplete="current-password" />
            </div>
            <div class="form-row">
              <button type="submit" class="auth-button" id="login-button">Login</button>
            </div>
            <div id="login-message" role="status" aria-live="polite" class="form-message"></div>
            <p style="text-align: center; margin-top: 16px; color: var(--gray-600);">
              Don't have an account? 
              <a href="#/register" style="color: var(--primary-600); text-decoration: none; font-weight: 500;">
                Register here
              </a>
            </p>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender(pageElement) {
    const form = pageElement.querySelector("#login-form");
    const messageEl = pageElement.querySelector("#login-message");
    const loginButton = pageElement.querySelector("#login-button");

    if (!form || !messageEl) {
      console.error("Login form elements not found on the page!");
      return;
    }

    // Double check auth state
    const token = localStorage.getItem("authToken");
    if (token) {
      window.location.hash = "#/map";
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      messageEl.textContent = "";
      messageEl.style.color = "";

      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;

      if (!email || !password) {
        this.showMessage("Please fill in all fields", "error", messageEl);
        return;
      }

      try {
        // Show loading state
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
        loginButton.classList.add('loading');

        const res = await loginUser({ email, password });

        if (res && res.error === false && res.loginResult && res.loginResult.token) {
          // Save auth data
          localStorage.setItem("authToken", res.loginResult.token);
          if (res.loginResult.name) localStorage.setItem("authName", res.loginResult.name);
          if (res.loginResult.userId) localStorage.setItem("authUserId", res.loginResult.userId);

          this.showMessage("Login successful! Redirecting...", "success", messageEl);

          if (window.showToast) window.showToast("Login successful");

          // Trigger auth change event
          window.dispatchEvent(new Event("authchange"));

          // Redirect to map page after short delay
          setTimeout(() => {
            window.location.hash = "#/map";
          }, 1000);

        } else {
          this.showMessage((res && res.message) || "Login failed", "error", messageEl);
        }
      } catch (err) {
        console.error("Login error:", err);
        this.showMessage("Login error: " + err.message, "error", messageEl);
      } finally {
        // Reset button state
        loginButton.disabled = false;
        loginButton.textContent = "Login";
        loginButton.classList.remove('loading');
      }
    });
  }

  showMessage(message, type, messageEl) {
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.color = type === "success" ? "var(--success)" : "var(--error)";
      messageEl.className = `form-message ${type}`;
    }

    // Also show toast if available
    if (window.showToast) {
      window.showToast(message, type);
    }
  }
}