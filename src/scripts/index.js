// scripts/index.js
import "../styles/styles.css";
import App from "./pages/app";
import {
  getVapidPublicKey,
  registerPushSubscription
} from "./data/api";

class PushNotificationManager {
  static async init() {
    if (!this.isSupported()) {
      console.log("Push notifications not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered successfully:', registration);

      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');

      if (!navigator.serviceWorker.controller) {
        console.log('Reloading page to activate Service Worker...');
        window.location.reload();
        return;
      }

      await this.updateUI();
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }

  static isSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  static async getSubscriptionStatus() {
    if (!this.isSupported()) {
      return {
        supported: false,
        subscribed: false
      };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      return {
        supported: true,
        subscribed: !!subscription,
        subscription: subscription,
      };
    } catch (error) {
      console.error("Error getting subscription status:", error);
      return {
        supported: true,
        subscribed: false,
        error: error.message
      };
    }
  }

  static async subscribe() {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported in this browser");
    }

    if (Notification.permission === "denied") {
      throw new Error(
        "Notification permission denied. Please enable in browser settings."
      );
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error(
          "Notification permission is required for push notifications"
        );
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log("Already subscribed to push notifications");
        await this.updateUI();
        return subscription;
      }

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        throw new Error("VAPID public key not available from server");
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey),
      });

      localStorage.setItem("pushSubscription", JSON.stringify(subscription));
      localStorage.setItem("pushSubscribed", "1");

      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          await registerPushSubscription({
            token,
            subscription
          });
          console.log("Push subscription registered with server");
        } catch (serverError) {
          console.warn(
            "Failed to register subscription with server:",
            serverError
          );
        }
      }

      console.log("Successfully subscribed to push notifications");
      await this.updateUI();
      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  static async unsubscribe() {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported in this browser");
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const success = await subscription.unsubscribe();
        if (success) {
          localStorage.removeItem("pushSubscription");
          localStorage.removeItem("pushSubscribed");
          console.log("Successfully unsubscribed from push notifications");
          await this.updateUI();
          return true;
        }
      }

      localStorage.removeItem("pushSubscription");
      localStorage.removeItem("pushSubscribed");
      await this.updateUI();
      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  static async updateUI() {
    const pushToggleBtn = document.getElementById("push-toggle");
    if (!pushToggleBtn) return;

    try {
      const status = await this.getSubscriptionStatus();
      const isSubscribed = status.subscribed;

      pushToggleBtn.textContent = isSubscribed ? "Disable Push" : "Enable Push";
      pushToggleBtn.title = isSubscribed ?
        "Disable push notifications" :
        "Enable push notifications";

      if (isSubscribed) {
        pushToggleBtn.style.backgroundColor = "#e74c3c";
        pushToggleBtn.classList.add("subscribed");
      } else {
        pushToggleBtn.style.backgroundColor = "#2ecc71";
        pushToggleBtn.classList.remove("subscribed");
      }
    } catch (error) {
      console.error("Error updating push UI:", error);
    }
  }

  static async triggerTestNotification() {
    if (!navigator.serviceWorker.controller) {
      throw new Error("Service Worker not active");
    }

    const testData = {
      type: "TRIGGER_PUSH",
      title: "🎉 StoryMap - Test Successful!",
      body: "Push notifications are working perfectly! Your submission criteria should be met.",
      icon: "/favicon.png",
      url: "/#/map",
    };

    navigator.serviceWorker.controller.postMessage(testData);
    console.log("Test notification triggered");
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

class PWAUpdateManager {
  static async register() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let registration;
    try {
      registration = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered: ", registration);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("SW update found");

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            if (window.showToast) {
              window.showToast(
                "New version available! Refresh to update.",
                "info"
              );
            }
          }
        });
      });
    } catch (error) {
      console.error("SW registration failed: ", error);
    }

    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  }
}

class AuthStateManager {
  static checkInitialAuthState() {
    const token = localStorage.getItem("authToken");
    const currentHash = window.location.hash;

    console.log("Initial auth check:", {
      hasToken: !!token,
      currentHash: currentHash || "#/",
    });

    if (token) {
      if (
        currentHash === "#/login" ||
        currentHash === "#/register" ||
        !currentHash ||
        currentHash === "#/" ||
        currentHash === ""
      ) {
        console.log("Redirecting to map (user is logged in)");
        window.location.hash = "#/map";
      }
    } else {
      const protectedRoutes = ["#/map", "#/add", "#/saved", "#/", ""];
      if (protectedRoutes.includes(currentHash)) {
        console.log("Redirecting to login (user is not logged in)");
        window.location.hash = "#/login";
      }
    }
  }

  static handleAuthChange() {
    console.log("Auth change detected");
    updateNav();
    updateUserName();

    const token = localStorage.getItem("authToken");
    const currentHash = window.location.hash;

    if (token) {
      if (currentHash === "#/login" || currentHash === "#/register") {
        console.log("Redirecting to map after login");
        window.location.hash = "#/map";
      }
    } else {
      if (currentHash !== "#/login" && currentHash !== "#/register") {
        console.log("Redirecting to login after logout");
        window.location.hash = "#/login";
      }
    }
  }
}

function showToast(message, type = "info", timeout = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) {
    console.warn("Toast container not found");
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, timeout);
}

function updateNav() {
  const token = localStorage.getItem("authToken");
  const authOnly = ["nav-map", "nav-add", "nav-saved"];
  const guestOnly = ["nav-login", "nav-register"];

  authOnly.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = token ? "" : "none";
  });

  guestOnly.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = token ? "none" : "";
  });
}

function updateUserName() {
  const name = localStorage.getItem("authName");
  const el = document.getElementById("user-name");
  const avatarEl = document.getElementById("user-avatar");
  const logoutBtn = document.getElementById("logout-button-header");

  if (el) el.textContent = name ? `Hi, ${name}` : "";
  if (avatarEl) avatarEl.textContent = name ? name[0].toUpperCase() : "";
  if (logoutBtn) {
    logoutBtn.style.display = localStorage.getItem("authToken") ? "" : "none";
    logoutBtn.onclick = () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authName");
      localStorage.removeItem("authUserId");
      window.dispatchEvent(new Event("authchange"));
      showToast("Logged out successfully", "success");
    };
  }
}

function setupPWAInstall() {
  let deferredInstallPrompt = null;
  const installBtn = document.getElementById("install-button");

  if (!installBtn) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.style.display = "";

    installBtn.onclick = async () => {
      try {
        installBtn.disabled = true;
        installBtn.textContent = "Installing...";
        deferredInstallPrompt.prompt();

        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          showToast("App installed successfully!", "success");
        } else {
          showToast("Installation cancelled", "info");
        }
      } catch (err) {
        console.error("Install prompt error", err);
        showToast("Installation failed", "error");
      } finally {
        installBtn.disabled = false;
        installBtn.textContent = "Install";
        installBtn.style.display = "none";
        deferredInstallPrompt = null;
      }
    };
  });

  window.addEventListener("appinstalled", () => {
    const installBtn = document.getElementById("install-button");
    if (installBtn) installBtn.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("StoryMap App Initializing...");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        console.log("Service Worker ready:", registration);
        console.log(
          "Service Worker controller:",
          navigator.serviceWorker.controller
        );
      })
      .catch((error) => {
        console.error("Service Worker ready failed:", error);
      });
  }

  await PWAUpdateManager.register();

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await PushNotificationManager.init();

  window.showToast = showToast;

  setupPWAInstall();

  updateUserName();
  updateNav();

  const pushToggleBtn = document.getElementById("push-toggle");
  if (pushToggleBtn) {
    pushToggleBtn.addEventListener("click", async () => {
      try {
        const status = await PushNotificationManager.getSubscriptionStatus();
        const isSubscribed = status.subscribed;

        if (isSubscribed) {
          await PushNotificationManager.unsubscribe();
          showToast("Push notifications disabled", "success");
        } else {
          await PushNotificationManager.subscribe();
          showToast("Push notifications enabled!", "success");

          setTimeout(async () => {
            try {
              await navigator.serviceWorker.ready;
              await PushNotificationManager.triggerTestNotification();
            } catch (testError) {
              console.error("Test notification failed:", testError);
            }
          }, 3000);
        }
      } catch (error) {
        console.error("Push notification error:", error);
        showToast(`Error: ${error.message}`, "error");
      }
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log(
        "Service worker message received in main thread:",
        event.data
      );
      if (event.data && event.data.type === "NAVIGATE_TO") {
        window.location.hash = event.data.path;
      }
    });
  }

  window.addEventListener("authchange", AuthStateManager.handleAuthChange);

  AuthStateManager.checkInitialAuthState();

  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", (event) => {
      event.preventDefault();
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.setAttribute("tabindex", "-1");
        mainContent.focus();
      }
    });
  }

  try {
    await app.renderPage();
  } catch (error) {
    console.error("Error in initial page render:", error);
    showToast("Error loading page", "error");
  }

  window.addEventListener("hashchange", async () => {
    try {
      await app.renderPage();
    } catch (error) {
      console.error("Error rendering page after hash change:", error);
    }
  });

  console.log("StoryMap App Initialized Successfully");
});