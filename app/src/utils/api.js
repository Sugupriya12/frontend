import localforage from "localforage";

export async function apiFetch(url, options = {}) {
  const isOnline = navigator.onLine;

  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : null;

  // ✅ OFFLINE MODE
  if (!isOnline && method !== "GET") {
    const queue = (await localforage.getItem("syncQueue")) || [];

    queue.push({
      url,
      method,
      body,
      status: "pending",
    });

    await localforage.setItem("syncQueue", queue);

    return {
      success: true,
      offline: true,
      message: "Saved offline",
    };
  }

  // 🌐 ONLINE MODE
  try {
    const res = await fetch(`http://localhost:5000${url}`, options);
    return await res.json();
  } catch (error) {
    console.log("Error:", error);
    return { success: false };
  }
}