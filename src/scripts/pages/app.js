// scripts/pages/app.js
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

  #checkAuthAccess(url) {
    const token = localStorage.getItem('authToken');
    const protectedRoutes = ['/', '/map', '/add', '/saved'];
    const guestRoutes = ['/login', '/register'];

    // Jika tidak ada token dan mencoba akses protected route
    if (!token && protectedRoutes.includes(url)) {
      window.location.hash = '#/login';
      return false;
    }

    // Jika ada token dan mencoba akses guest route
    if (token && guestRoutes.includes(url)) {
      window.location.hash = '#/map';
      return false;
    }

    return true;
  }

  async renderPage() {
    if (!this.#content) return;

    const oldCameraStream = document.querySelector("video");
    if (oldCameraStream && oldCameraStream.srcObject) {
      oldCameraStream.srcObject.getTracks().forEach((track) => track.stop());
      oldCameraStream.srcObject = null;
    }

    const url = getActiveRoute();
    
    // Check authentication before rendering
    if (!this.#checkAuthAccess(url)) {
      return;
    }

    const PageClass = routes[url];

    if (!PageClass) {
      window.location.hash = "#/";
      return;
    }

    try {
      const page = new PageClass();
      
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

      const oldPage = this.#content.querySelector(".page");

      const doSwap = (useCssFallback = false) => {
        const TRANSITION_DURATION = 350;

        if (useCssFallback) {
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
            doSwap(false);
          });
        } else {
          const d = doSwap(true);
          await new Promise((r) => setTimeout(r, d));
        }
      } catch (err) {
        const d = doSwap(true);
        await new Promise((r) => setTimeout(r, d));
      }

      if (page.afterRender) {
        await page.afterRender(newPage);
      }
    } catch (error) {
      console.error('Error creating page instance:', error);
      this.#content.innerHTML = `
        <div class="container">
          <h1>Error Loading Page</h1>
          <p>There was an error loading the page. Please try again.</p>
          <button onclick="location.reload()" class="btn-primary">Reload Page</button>
        </div>
      `;
    }
  }
}

export default App;