require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getClusters, getClusterById, getTimeline } = require("./db");
const { triggerIngestRoute, getStatusRoute } = require("./routes/ingest");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/clusters", async (req, res) => {
  try {
    const clusters = await getClusters();
    res.json(clusters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clusters" });
  }
});

app.get("/clusters/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Cluster id must be a number" });
  }
  try {
    const cluster = await getClusterById(id);
    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found" });
    }
    res.json(cluster);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cluster" });
  }
});

app.get("/timeline", async (req, res) => {
  try {
    const timeline = await getTimeline();
    res.json(timeline);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

app.post("/ingest/trigger", triggerIngestRoute);
app.get("/ingest/status/:jobId", getStatusRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));