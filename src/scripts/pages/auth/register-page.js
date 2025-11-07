// pages/auth/register-page.js
import { registerUser } from "../../data/api";

export default class RegisterPage {
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
          <h1 class="auth-title">Create account</h1>
          <p class="auth-sub">Register a new account to post stories</p>
          <form id="register-form">
            <div class="form-row">
              <label for="name">Full name</label>
              <input id="name" name="name" type="text" required autocomplete="name" />
            </div>
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required autocomplete="email" />
            </div>
            <div class="form-row">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" />
            </div>
            <div class="form-row">
              <button type="submit" class="auth-button" id="register-button">Register</button>
            </div>
            <div id="register-message" role="status" aria-live="polite" class="form-message"></div>
            <p style="text-align: center; margin-top: 16px; color: var(--gray-600);">
              Already have an account? 
              <a href="#/login" style="color: var(--primary-600); text-decoration: none; font-weight: 500;">
                Login here
              </a>
            </p>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender(pageElement) {
    const form = pageElement.querySelector("#register-form");
    const messageEl = pageElement.querySelector("#register-message");
    const registerButton = pageElement.querySelector("#register-button");

    if (!form || !messageEl) {
      console.error("Register form elements not found on the page!");
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

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;

      if (!name || !email || !password) {
        this.showMessage("Please fill in all fields", "error", messageEl);
        return;
      }

      if (password.length < 8) {
        this.showMessage("Password must be at least 8 characters", "error", messageEl);
        return;
      }

      try {
        // Show loading state
        registerButton.disabled = true;
        registerButton.textContent = "Registering...";
        registerButton.classList.add('loading');

        const res = await registerUser({ name, email, password });

        if (res && res.error === false) {
          this.showMessage("Registration successful! Redirecting to login...", "success", messageEl);

          if (window.showToast) window.showToast("Registration successful");

          // Auto redirect to login page after successful registration
          setTimeout(() => {
            window.location.hash = "#/login";
          }, 2000);

        } else {
          this.showMessage((res && res.message) || "Registration failed", "error", messageEl);
        }
      } catch (err) {
        console.error("Registration error:", err);
        this.showMessage("Registration error: " + err.message, "error", messageEl);
      } finally {
        // Reset button state
        registerButton.disabled = false;
        registerButton.textContent = "Register";
        registerButton.classList.remove('loading');
      }
    });
  }

  showMessage(message, type, messageEl) {
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.color = type === "success" ? "var(--success)" : "var(--error)";
      messageEl.className = `form-message ${type}`;
    }

    if (window.showToast) {
      window.showToast(message, type);
    }
  }
}