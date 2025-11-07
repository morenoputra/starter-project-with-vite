import CONFIG from "../config";
const BASE = CONFIG.BASE_URL.replace(/\/$/, "");
export async function getStories({
  token = null,
  page = 1,
  size = 20,
  location = 1,
} = {}) {
  const url = `${BASE}/stories?page=${page}&size=${size}&location=${location}`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    headers,
  });
  const json = await response.json();
  return json;
}
export async function postStory({
  token = null,
  description = "",
  file = null,
  lat = null,
  lon = null,
} = {}) {
  const hasToken = !!token;
  const url = hasToken ? `${BASE}/stories` : `${BASE}/stories/guest`;
  const formData = new FormData();
  formData.append("description", description);
  if (file) formData.append("photo", file, file.name || "photo.jpg");
  if (lat != null) formData.append("lat", String(lat));
  if (lon != null) formData.append("lon", String(lon));
  const headers = {};
  if (hasToken) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });
  const json = await response.json();
  return json;
}
export async function registerUser({
  name,
  email,
  password
} = {}) {
  const url = `${BASE}/register`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
  return await response.json();
}
export async function loginUser({
  email,
  password
} = {}) {
  const url = `${BASE}/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  return await response.json();
}
export async function getVapidPublicKey() {
  if (CONFIG.VAPID_PUBLIC_KEY) {
    return CONFIG.VAPID_PUBLIC_KEY;
  }
  if (CONFIG.VAPID_ENDPOINT) {
    const url = CONFIG.VAPID_ENDPOINT.startsWith("http") ?
      CONFIG.VAPID_ENDPOINT :
      `${BASE}${CONFIG.VAPID_ENDPOINT}`;
    try {
      const headers = {};
      try {
        const t = window.localStorage.getItem("authToken");
        if (t) headers.Authorization = `Bearer ${t}`;
      } catch (e) {}
      const res = await fetch(url, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json) {
          if (json.key) return json.key;
          if (json.publicKey) return json.publicKey;
          if (typeof json === "string") return json;
        }
      }
    } catch (err) {}
  }
  return null;
}
export async function registerPushSubscription({ token = null, subscription } = {}) {
  if (!CONFIG.SUBSCRIBE_ENDPOINT) {
    return { error: true, message: "SUBSCRIBE_ENDPOINT not configured." };
  }

  const url = CONFIG.SUBSCRIBE_ENDPOINT.startsWith("http")
    ? CONFIG.SUBSCRIBE_ENDPOINT
    : `${BASE}${CONFIG.SUBSCRIBE_ENDPOINT}`;

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    // Pastikan bentuk JSON hanya memiliki endpoint & keys
    const sub = subscription.toJSON();
    const body = {
      endpoint: sub.endpoint,
      keys: sub.keys,
    };

    console.log("📦 Sending:", JSON.stringify(body, null, 2));

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return { error: true, message: "Unauthorized. Token invalid or expired." };
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Subscribe failed:", text);
      return { error: true, message: `Subscribe failed: ${res.status}` };
    }

    return await res.json();
  } catch (err) {
    console.error("⚠️ Error:", err);
    return { error: true, message: err.message };
  }
}


// FUNGSI BARU: Unregister Push Subscription
export async function unregisterPushSubscription({
  token = null,
  endpoint,
} = {}) {
  if (!CONFIG.SUBSCRIBE_ENDPOINT) {
    // Gunakan endpoint yang sama
    return {
      error: true,
      message: "SUBSCRIBE_ENDPOINT not configured.",
    };
  }
  const url = CONFIG.SUBSCRIBE_ENDPOINT.startsWith("http") ?
    CONFIG.SUBSCRIBE_ENDPOINT :
    `${BASE}${CONFIG.SUBSCRIBE_ENDPOINT}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        endpoint,
      }),
    });
    if (!res.ok)
      return {
        error: true,
        message: `Unsubscribe failed: ${res.status}`,
      };
    return await res.json();
  } catch (err) {
    return {
      error: true,
      message: err.message,
    };
  }
}