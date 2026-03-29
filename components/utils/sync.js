export async function syncData() {
  const queue = (await localforage.getItem("syncQueue")) || [];

  for (let item of queue) {
    if (item.status === "pending") {
      try {
        await fetch(`https://backendruralhealth1-2.onrender.com${item.url}`, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });

        item.status = "done";
      } catch (err) {
        console.log("Still offline...");
      }
    }
  }

  await localforage.setItem("syncQueue", queue);
}
