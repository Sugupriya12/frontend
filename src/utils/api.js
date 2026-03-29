

export async function apiFetch(url, options = {}) {
  const isOnline = navigator.onLine;

  // OFFLINE
  if (!isOnline && options.method !== "GET") {
    const queue = (await localforage.getItem("syncQueue")) || [];

    queue.push({
      url,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
      status: "pending",
    });

    await localforage.setItem("syncQueue", queue);

    return { offline: true };
  }

  // ONLINE
  try {
    console.log("API CALL:", url, options); // 🔥 DEBUG

    const res = await fetch(`http://localhost:5000${url}`, {
      method: options.method || "GET",   // ✅ FORCE METHOD
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body || null,        // ✅ FORCE BODY
    });

    const data = await res.json();

    console.log("API RESPONSE:", data); // 🔥 DEBUG

    return data;
  } catch (error) {
    console.error("API ERROR:", error);
    return { error: "Network error" };
  }
}
