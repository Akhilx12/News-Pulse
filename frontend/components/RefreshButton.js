"use client";

import { useState } from "react";
import { triggerIngest, fetchIngestStatus } from "../lib/api";

const POLL_INTERVAL_MS = 3000;

export default function RefreshButton({ onComplete }) {
  const [status, setStatus] = useState("idle"); // idle | running | completed | failed

  async function handleClick() {
    setStatus("running");
    try {
      const { jobId } = await triggerIngest();
      pollStatus(jobId);
    } catch (err) {
      setStatus("failed");
    }
  }

  function pollStatus(jobId) {
    const interval = setInterval(async () => {
      try {
        const job = await fetchIngestStatus(jobId);
        if (job.status === "completed") {
          clearInterval(interval);
          setStatus("completed");
          onComplete(); // tells page.js to re-fetch /timeline with fresh data
          setTimeout(() => setStatus("idle"), 2000); // reset button after a beat
        } else if (job.status === "failed") {
          clearInterval(interval);
          setStatus("failed");
        }
        // if still "running", do nothing — the interval will check again
      } catch (err) {
        clearInterval(interval);
        setStatus("failed");
      }
    }, POLL_INTERVAL_MS);
  }

  const labels = {
    idle: "Refresh data",
    running: "Refreshing...",
    completed: "Updated!",
    failed: "Failed — try again",
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "running"}
      className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${
        status === "failed" ? "bg-red-600" : "bg-blue-600 hover:bg-blue-700"
      } disabled:opacity-60`}
    >
      {labels[status]}
    </button>
  );
}