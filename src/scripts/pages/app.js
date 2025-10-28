import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

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
      
      this.#drawerButton.setAttribute('aria-controls', this.#navigationDrawer.id || 'navigation-drawer');
      this.#drawerButton.setAttribute('aria-expanded', 'false');

      const toggleDrawer = () => {
        const isOpen = this.#navigationDrawer.classList.toggle('open');
        this.#drawerButton.setAttribute('aria-expanded', String(isOpen));
      };

      this.#drawerButton.addEventListener('click', toggleDrawer);
      this.#drawerButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDrawer();
        }
      });

      document.body.addEventListener('click', (event) => {
        if (
          !this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)
        ) {
          this.#navigationDrawer.classList.remove('open');
        }

        this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
          if (link.contains(event.target)) {
            this.#navigationDrawer.classList.remove('open');
          }
        });
      });
    }
  }

  async renderPage() {
    if (!this.#content) return;


    const oldCameraStream = document.querySelector('video');
    if (oldCameraStream && oldCameraStream.srcObject) {
      oldCameraStream.srcObject.getTracks().forEach(track => track.stop());
      oldCameraStream.srcObject = null;
    }

    const url = getActiveRoute();
    const page = routes[url];

    const newPage = document.createElement('div');
    newPage.className = 'page page-enter';
    newPage.innerHTML = await page.render();

    const oldPage = this.#content.querySelector('.page');
    this.#content.appendChild(newPage);

    newPage.classList.add('page-enter-active');

    const TRANSITION_DURATION = 350;

    if (oldPage) {
      oldPage.classList.add('page-exit');
      setTimeout(() => {
        if (oldPage.parentElement) oldPage.remove();
      }, TRANSITION_DURATION);
    }

    await new Promise((resolve) => setTimeout(resolve, TRANSITION_DURATION));

    await page.afterRender();
  }
}

export default App;
