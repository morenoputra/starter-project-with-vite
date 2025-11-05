import "../styles/styles.css";
import App from "./pages/app";
import { getVapidPublicKey, registerPushSubscription } from "./data/api";
import { registerSW } from "virtual:pwa-register";

document.addEventListener("DOMContentLoaded", async () => {
  registerSW();
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  function updateNav() {
    const token = localStorage.getItem("authToken");
    const authOnly = ["nav-map", "nav-add"];
    const guestOnly = ["nav-login", "nav-register"];

    authOnly.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = token ? "" : "none";
    });

    guestOnly.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = token ? "none" : "";
    });
  }

  function updateUserName() {
    const name = localStorage.getItem("authName");
    const el = document.getElementById("user-name");
    const avatarEl = document.getElementById("user-avatar");
    const logoutBtn = document.getElementById("logout-button-header");
    if (el) el.textContent = name ? `Hi, ${name}` : "";
    if (avatarEl) avatarEl.textContent = name ? name[0].toUpperCase() : "";
    if (logoutBtn)
      logoutBtn.style.display = localStorage.getItem("authToken") ? "" : "none";
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authName");
        localStorage.removeItem("authUserId");
        window.dispatchEvent(new Event("authchange"));
        if (window.showToast) window.showToast("Logged out");
      };
    }
  }

  function showToast(message, timeout = 3500) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => {
      t.remove();
    }, timeout);
  }

  window.showToast = showToast;
  updateUserName();
  updateNav();

  const pushToggleBtn = document.getElementById("push-toggle");

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function isSubscribed(reg) {
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  }

  async function subscribeToPush() {
    if (!("Notification" in window)) {
      showToast("Push notifications are not supported in this browser");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("Notification permission denied");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    if (!reg) {
      showToast("Service Worker registration failed");
      return;
    }

    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      showToast("VAPID public key not available from API.");
      return;
    }

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      localStorage.setItem("pushSubscription", JSON.stringify(sub));
      localStorage.setItem("pushSubscribed", "1");
      if (pushToggleBtn) pushToggleBtn.textContent = "Disable Push";
      showToast("Subscribed to push notifications");

      const tokenNow = localStorage.getItem("authToken");
      try {
        await registerPushSubscription({ token: tokenNow, subscription: sub });
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error("subscribe error", err);
      showToast("Failed to subscribe to push: " + err.message);
    }
  }

  async function unsubscribeFromPush() {
    const reg = await navigator.serviceWorker.ready;
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      localStorage.removeItem("pushSubscription");
      localStorage.removeItem("pushSubscribed");
      if (pushToggleBtn) pushToggleBtn.textContent = "Enable Push";
      showToast("No push subscription found");
      return;
    }
    try {
      await sub.unsubscribe();
      localStorage.removeItem("pushSubscription");
      localStorage.removeItem("pushSubscribed");
      if (pushToggleBtn) pushToggleBtn.textContent = "Enable Push";
      showToast("Push subscription removed");
    } catch (err) {
      console.error("unsubscribe error", err);
      showToast("Failed to unsubscribe: " + err.message);
    }
  }

  if (pushToggleBtn) {
    const subscribed = localStorage.getItem("pushSubscribed") === "1";
    pushToggleBtn.textContent = subscribed ? "Disable Push" : "Enable Push";
    pushToggleBtn.onclick = async () => {
      const currently = localStorage.getItem("pushSubscribed") === "1";
      if (currently) await unsubscribeFromPush();
      else await subscribeToPush();
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {});
    }
  }

  let deferredInstallPrompt = null;
  const installBtn = document.getElementById("install-button");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.style.display = "";
      installBtn.onclick = async () => {
        try {
          installBtn.disabled = true;
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          if (choice.outcome === "accepted") {
            window.showToast && window.showToast("App installed");
          } else {
            window.showToast && window.showToast("Install dismissed");
          }
        } catch (err) {
          console.error("Install prompt error", err);
        } finally {
          installBtn.disabled = false;
          installBtn.style.display = "none";
          deferredInstallPrompt = null;
        }
      };
    }
  });

  window.addEventListener("appinstalled", () => {
    const installBtn = document.getElementById("install-button");
    if (installBtn) installBtn.style.display = "none";
  });

  const token = localStorage.getItem("authToken");
  if (!token) {
    if (location.hash !== "#/login" && location.hash !== "#/register") {
      location.hash = "#/login";
    }
  }

  window.addEventListener("authchange", () => {
    updateNav();
    const tokenNow = localStorage.getItem("authToken");
    if (!tokenNow) {
      location.hash = "#/login";
    }
    updateUserName();
  });

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

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
