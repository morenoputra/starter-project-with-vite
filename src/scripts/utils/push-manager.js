import { registerPushSubscription, unregisterPushSubscription } from "./api";
import CONFIG from "./config"; 

class PushManager {
  static VAPID_PUBLIC_KEY = CONFIG.VAPID_PUBLIC_KEY;

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
        subscribed: false,
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
        error: error.message,
      };
    }
  }

  static async subscribe() {
    if (!this.isSupported()) {
      throw new Error("Push notifications tidak didukung di browser ini");
    }

    if (Notification.permission === "denied") {
      throw new Error(
        "Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser."
      );
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error(
          "Izin notifikasi diperlukan untuk mengaktifkan push notification"
        );
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Jika sudah ada, kirim ulang ke API
        await this.sendSubscriptionToApi(subscription);
        return subscription;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY),
      });

      await this.sendSubscriptionToApi(subscription);

      console.log("Berhasil subscribe ke push notification:", subscription);
      return subscription;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      throw error;
    }
  }

  static async sendSubscriptionToApi(subscription) {
    const token = localStorage.getItem("authToken");

    // MENGGUNAKAN FUNGSI API YANG SUDAH TERKONFIGURASI
    const response = await registerPushSubscription({ token, subscription });

    if (response.error) {
      console.error(
        "Gagal mendaftarkan subscription ke API Story:",
        response.message
      );
      await subscription.unsubscribe(); // Hapus subscription dari browser jika gagal didaftarkan ke API
      throw new Error(
        `Gagal mendaftar ke API Story (Pesan: ${response.message})`
      );
    }
    console.log("Subscription berhasil didaftarkan ke API Story.");
  }

  static async unsubscribe() {
    if (!this.isSupported()) {
      throw new Error("Push notifications tidak didukung di browser ini");
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const token = localStorage.getItem("authToken");

        // MENGGUNAKAN FUNGSI API YANG SUDAH TERKONFIGURASI
        const response = await unregisterPushSubscription({
          token,
          endpoint: subscription.endpoint,
        });

        if (response.error) {
          console.error(
            "Gagal menghapus subscription di API Story:",
            response.message
          );
        } else {
          console.log("Subscription berhasil dihapus dari API Story.");
        }

        const success = await subscription.unsubscribe();
        if (success) {
          console.log("Berhasil unsubscribe dari push notification");
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      throw error;
    }
  }

  static async triggerTestNotification() {
    if (!navigator.serviceWorker.controller) {
      throw new Error("Service Worker tidak aktif");
    }

    navigator.serviceWorker.controller.postMessage({
      type: "TRIGGER_PUSH",
      title: "Test Notifikasi Berhasil! 🎉",
      body: "Push notification berfungsi dengan baik. Kriteria submission terpenuhi!",
      icon: "/tavicon.png",
      url: window.location.origin,
    });

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

export default PushManager;
