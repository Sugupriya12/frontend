import localforage from "localforage";

const API_BASE = "https://backendruralhealth1-2.onrender.com";

export async function apiFetch(url, options = {}) {
  const isOnline = navigator.onLine;
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : null;

  // ── OFFLINE: non-GET writes go to sync queue ──────────────────────────────
  if (!isOnline && method !== "GET") {
    const queue = (await localforage.getItem("syncQueue")) || [];
    queue.push({ url, method, body, status: "pending" });
    await localforage.setItem("syncQueue", queue);
    return { success: true, offline: true, message: "Saved offline" };
  }

  // ── OFFLINE: GET reads fall back to localforage cache ─────────────────────
  if (!isOnline && method === "GET") {
    // e.g. /reports/P123  →  key: reports_P123
    const cacheKey = url.replace(/^\//, "").replace(/\//g, "_");
    const cached = await localforage.getItem(cacheKey);
    if (cached) return { success: true, offline: true, data: cached };
    return { success: false, offline: true, message: "No cached data" };
  }

  // ── ONLINE ─────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${API_BASE}${url}`, options);
    const data = await res.json();

    // Auto-cache GET responses for offline use
    if (method === "GET") {
      const cacheKey = url.replace(/^\//, "").replace(/\//g, "_");
      await localforage.setItem(cacheKey, data);
    }

    return data;
  } catch (error) {
    console.error("apiFetch error:", error);
    return { success: false };
  }
}

// ── Sync queued offline writes when back online ─────────────────────────────
export async function syncOfflineQueue() {
  if (!navigator.onLine) return;

  const queue = (await localforage.getItem("syncQueue")) || [];
  if (queue.length === 0) return;

  const remaining = [];

  for (const item of queue) {
    try {
      const res = await fetch(`${API_BASE}${item.url}`, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });

      if (!res.ok) {
        remaining.push({ ...item, status: "failed" });
      }
    } catch {
      remaining.push({ ...item, status: "failed" });
    }
  }

  await localforage.setItem("syncQueue", remaining);
  console.log(`Sync complete. ${queue.length - remaining.length} synced, ${remaining.length} failed.`);
}
