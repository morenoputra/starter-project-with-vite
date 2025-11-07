// src/components/push-notification-ui.js
import PushManager from '../utils/push-manager.js';

class PushNotificationUI {
  constructor() {
    this.container = null;
    this.isSubscribed = false;
    this.init();
  }

  async init() {
    await this.checkStatus();
    this.render();
  }

  async checkStatus() {
    const status = await PushManager.getSubscriptionStatus();
    this.isSubscribed = status.subscribed;
    return status;
  }

  render() {
    this.createContainer();
    this.updateContent();
    this.attachEventListeners();
  }

  createContainer() {
    if (this.container) this.container.remove();

    this.container = document.createElement('div');
    this.container.className = 'push-notification-ui animate-in';
    document.body.appendChild(this.container);
  }

  updateContent() {
    const statusText = this.isSubscribed ? '🔔 Notifikasi Aktif' : '🔕 Notifikasi Nonaktif';
    const buttonText = this.isSubscribed ? 'Nonaktifkan' : 'Aktifkan';
    const description = this.isSubscribed
      ? 'Anda akan menerima notifikasi ketika ada cerita rakyat baru.'
      : 'Aktifkan untuk mendapatkan notifikasi cerita rakyat baru.';

    this.container.innerHTML = `
      <div class="push-header">
        <h3>Push Notification</h3>
        <p class="push-status ${this.isSubscribed ? 'active' : 'inactive'}">${statusText}</p>
        <p class="push-description">${description}</p>
      </div>

      <div class="push-buttons">
        <button id="push-toggle" class="btn ${this.isSubscribed ? 'btn-danger' : 'btn-success'}">
          ${buttonText}
        </button>

        ${this.isSubscribed ? `<button id="push-test" class="btn btn-primary">Test</button>` : ''}

        <button id="push-close" class="btn btn-secondary">Tutup</button>
      </div>

      ${!PushManager.isSupported() ? `
        <div class="push-warning">
          ⚠️ Browser tidak mendukung push notification
        </div>
      ` : ''}
    `;
  }

  attachEventListeners() {
    const toggleBtn = this.container.querySelector('#push-toggle');
    const testBtn = this.container.querySelector('#push-test');
    const closeBtn = this.container.querySelector('#push-close');

    if (toggleBtn) toggleBtn.addEventListener('click', () => this.handleToggle());
    if (testBtn) testBtn.addEventListener('click', () => this.handleTest());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
  }

  async handleToggle() {
    try {
      if (this.isSubscribed) {
        await PushManager.unsubscribe();
        this.showMessage('Notifikasi dinonaktifkan', 'success');
      } else {
        await PushManager.subscribe();
        this.showMessage('Notifikasi diaktifkan!', 'success');
      }
      await this.checkStatus();
      this.updateContent();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  async handleTest() {
    try {
      await PushManager.triggerTestNotification();
      this.showMessage('Notifikasi test dikirim!', 'success');
    } catch (error) {
      console.error('Error testing notification:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  showMessage(message, type = 'info') {
    const existingMsg = this.container.querySelector('.push-message');
    if (existingMsg) existingMsg.remove();

    const msg = document.createElement('div');
    msg.className = `push-message ${type}`;
    msg.textContent = message;
    this.container.appendChild(msg);

    setTimeout(() => msg.remove(), 3000);
  }

  close() {
    if (this.container) {
      this.container.classList.add('animate-out');
      setTimeout(() => this.container.remove(), 250);
    }
  }

  static show() {
    return new PushNotificationUI();
  }
}

export default PushNotificationUI;
