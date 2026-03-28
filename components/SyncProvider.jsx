"use client";

import { useEffect } from "react";
import { syncData } from "./utils/sync";
export default function SyncProvider() {
  useEffect(() => {
    window.addEventListener("online", syncData);

    return () => {
      window.removeEventListener("online", syncData);
    };
  }, []);

  return null; // no UI
}