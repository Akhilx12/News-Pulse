// data fetching layer

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchTimeline() {
  const res = await fetch(`${API_URL}/timeline`);
  if (!res.ok) {
    throw new Error(`Failed to fetch timeline: ${res.status}`);
  }
  return res.json();
}

export async function fetchClusterDetail(clusterId) {
  const res = await fetch(`${API_URL}/clusters/${clusterId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cluster ${clusterId}: ${res.status}`);
  }
  return res.json();
}

export async function triggerIngest() {
  const res = await fetch(`${API_URL}/ingest/trigger`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Failed to trigger ingest: ${res.status}`);
  }
  return res.json(); //jobId
}

export async function fetchIngestStatus(jobId) {
  const res = await fetch(`${API_URL}/ingest/status/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job status: ${res.status}`);
  }
  return res.json();
}