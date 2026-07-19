# News Pulse
A system that ingests RSS articles from BBC, NPR, and Al Jazeera, groups the into topic clusters via keyword overlap, and visualizes them as an interactive timeline.

## Stack & Architecture
- **Python** (ingestion pipeline): feedparser, trafilatura, dateutil, psycopg2
- **Node.js/Express** (API layer): pg, native child_process for pipeline triggering
- **Next.js/React** (frontend): recharts for timeline visualization, Tailwind CSS
- **PostgreSQL** (Supabase, session pooler connection)

Python and Node never communicate directly — Postgres is the bridge between them. This keeps ingestion, API, and UI independently deployable and testable.

## Part 1 — Python Pipeline

**Feeds used:** BBC News, NPR, Al Jazeera (all public RSS).

**Clustering approach:** Keyword-overlap grouping (Option A). Headlines and summaries are tokenized, stop-words removed, and articles sharing enough keywords are grouped. Chosen over TF-IDF for simplicity and easier debugging, and the brief treats both as equally valid.

**Threshold tuning:** Tested overlap thresholds of 4, 2, and 3 against the same dataset.
- Threshold=4: too strict — fragmented clearly-related stories (e.g. World Cup coverage split across 5 separate clusters).

- Threshold=2: too loose — generic high-frequency words ("war", "people") caused unrelated articles to merge into oversized clusters (34 articles in one cluster).

- Threshold=3: best balance — used in the final submission.

**Known limitation — cluster drift over time:** Because new articles are compared against the aggregate keyword pool of existing clusters (required for correct re-clustering across pipeline runs), large clusters can slowly absorb unrelated articles as their keyword pool grows more generic. Observed concretely: after several runs, a "World Cup" cluster absorbed an unrelated Ukraine drone-strike story and a South Korean political bribery case, both sharing the word "world" in passing. A fix (excluding more generic words like "world"/"their" from the stop-word list) was identified and validated, but not applied to the final dataset due to time constraints — applying it requires a full re-cluster of existing data.

**Other handled inconsistencies:**
- Feed field name differences (`description` vs `content:encoded`) normalized via fallback chains.
- Date format/timezone differences resolved via `dateutil`; stored as UTC via Postgres `TIMESTAMPTZ`.
- URL tracking parameters stripped before deduplication.
- Known non-article RSS entries (e.g. "BBC News app" promotional feed items) filtered at ingestion, since they distorted cluster date ranges.
- Full-text extraction failures (e.g. video-only pages) handled gracefully, falling back to headline/summary for clustering.

**Re-runnability:** URL uniqueness constraint + existence check before insert prevents duplicate storage. New articles are compared against existing cluster pools first, so follow-up stories join prior clusters rather than always starting new ones.

## Part 2 — Node/Express API

All required endpoints implemented: `GET /clusters`, `GET /clusters/:id`, `GET /timeline`, `POST /ingest/trigger`, `GET /ingest/status/:jobId`.

**Design notes:**

- `/timeline` includes a `sources` array per cluster (added beyond the original spec) so the frontend can filter the timeline by source without needing a separate endpoint.

- Ingest triggering uses Node's `child_process.spawn` to run the Python pipeline as a subprocess, returning a `202 Accepted` with a job ID immediately. Job status is tracked in-memory (sufficient for this single-instance deployment; would move to a persisted store for multi-instance scaling).

- Database connection uses Supabase's session pooler rather than the direct connection string — the direct host resolved to an IPv6-only address that failed on the development network; the pooler is IPv4-compatible.

## Part 3 — Next.js Frontend

- Timeline built with recharts, using a stacked horizontal bar chart (offset + duration bars) since recharts has no native Gantt/timeline primitive.

- Source filter uses "at least one matching source" visibility logic for multi-source clusters (a cluster stays visible if any of its sources are active, rather than requiring all). The cluster detail view applies the same active-source filter to its article list for consistency.

- Refresh button polls `/ingest/status/:jobId` every 3 seconds and re-fetches the timeline automatically on completion.
