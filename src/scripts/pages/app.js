import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#setupDrawer();
  }

  #setupDrawer() {
    if (this.#drawerButton && this.#navigationDrawer) {
      this.#drawerButton.setAttribute(
        "aria-controls",
        this.#navigationDrawer.id || "navigation-drawer"
      );
      this.#drawerButton.setAttribute("aria-expanded", "false");

      const toggleDrawer = () => {
        const isOpen = this.#navigationDrawer.classList.toggle("open");
        this.#drawerButton.setAttribute("aria-expanded", String(isOpen));
      };

      this.#drawerButton.addEventListener("click", toggleDrawer);
      this.#drawerButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDrawer();
        }
      });

      document.body.addEventListener("click", (event) => {
        if (
          !this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)
        ) {
          this.#navigationDrawer.classList.remove("open");
        }

        this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
          if (link.contains(event.target)) {
            this.#navigationDrawer.classList.remove("open");
          }
        });
      });
    }
  }

  async renderPage() {
    if (!this.#content) return;

    const oldCameraStream = document.querySelector("video");
    if (oldCameraStream && oldCameraStream.srcObject) {
      oldCameraStream.srcObject.getTracks().forEach((track) => track.stop());
      oldCameraStream.srcObject = null;
    }

    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      window.location.hash = "#/";
      return;
    }

    const newPage = document.createElement("div");
    newPage.className = "page";
    newPage.innerHTML = await page.render();

    const hasH1 = !!newPage.querySelector("h1");
    if (!hasH1) {
      const url = window.location.hash.replace("#", "") || "/";
      const titleMap = {
        "/": "Map",
        "/map": "Map",
        "/add": "Add Story",
        "/saved": "Saved Stories",
        "/login": "Login",
        "/register": "Register",
      };
      const h1 = document.createElement("h1");
      h1.textContent = titleMap[url] || "Page";
      const firstSection = newPage.querySelector("section") || newPage;
      firstSection.insertBefore(h1, firstSection.firstChild);
    }

    const oldPage = this.#content.querySelector(".page"); // --- INI LOGIKA 'doSwap' YANG SUDAH DIPERBAIKI ---

    const doSwap = (useCssFallback = false) => {
      const TRANSITION_DURATION = 350;

      if (useCssFallback) {
        // Logika Fallback (menggunakan animasi CSS)
        newPage.classList.add("page-enter");
        this.#content.appendChild(newPage);
        newPage.getBoundingClientRect();
        newPage.classList.add("page-enter-active");

        if (oldPage) {
          oldPage.classList.add("page-exit");
          setTimeout(() => {
            if (oldPage.parentElement) oldPage.remove();
          }, TRANSITION_DURATION);
        }
        return TRANSITION_DURATION;
      } else {
        // Logika Modern (untuk startViewTransition)
        // Gunakan replaceChild untuk menukar halaman lama dengan baru
        if (oldPage) {
          this.#content.replaceChild(newPage, oldPage);
        } else {
          this.#content.appendChild(newPage);
        }
        return 0;
      }
    };

    try {
      if (typeof document.startViewTransition === "function") {
        await document.startViewTransition(() => {
          doSwap(false); // Menjalankan logika modern
        });
      } else {
        const d = doSwap(true); // Menjalankan logika fallback
        await new Promise((r) => setTimeout(r, d));
      }
    } catch (err) {
      const d = doSwap(true);
      await new Promise((r) => setTimeout(r, d));
    }

    await page.afterRender(newPage);
  }
}

export default App;
