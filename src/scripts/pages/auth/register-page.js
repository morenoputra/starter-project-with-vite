import { registerUser } from "../../data/api";

export default class RegisterPage {
  async render() {
    return `
      <section class="auth-container">
        <div class="auth-card">
          <h1 class="auth-title">Create account</h1>
          <p class="auth-sub">Register a new account to post stories</p>
          <form id="register-form">
            <div class="form-row">
              <label for="name">Full name</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div class="form-row">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" required minlength="8" />
            </div>
            <div class="form-row">
              <button type="submit" class="auth-button">Register</button>
            </div>
            <div id="register-message" role="status" aria-live="polite" class="form-message"></div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender(pageElement) {
    const form = pageElement.querySelector("#register-form");
    const messageEl = pageElement.querySelector("#register-message");

    if (!form || !messageEl) {
      console.error("Register form elements not found on the page!");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      messageEl.textContent = "";

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;

      try {
        const res = await registerUser({ name, email, password });
        if (res && res.error === false) {
          messageEl.style.color = "green";
          messageEl.textContent = "Registration successful. You can now login.";
          if (window.showToast) window.showToast("Registration successful");
        } else {
          messageEl.style.color = "red";
          messageEl.textContent = (res && res.message) || "Registration failed";
          if (window.showToast) window.showToast(messageEl.textContent);
        }
      } catch (err) {
        messageEl.style.color = "red";
        messageEl.textContent = "Registration error: " + err.message;
      }
    });
  }
}
