const { spawn } = require("child_process");
const path = require("path");
const { createJob, completeJob, failJob, getJob } = require("../jobs");

function triggerIngestRoute(req, res) {
  const jobId = createJob();

  const pipelineDir = path.join(__dirname, "..", "..", "python-pipeline");
  const pipelineScript = "pipeline.py";

  const pythonCommand = process.env.PYTHON_COMMAND || "python";
  const pythonProcess = spawn(pythonCommand, [pipelineScript], {
    cwd: pipelineDir,
  });

  let stderrOutput = "";

  pythonProcess.stderr.on("data", (data) => {
    stderrOutput += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      completeJob(jobId);
    } else {
      failJob(jobId, stderrOutput || `Process exited with code ${code}`);
    }
  });

  pythonProcess.on("error", (err) => {
    failJob(jobId, `Failed to start pipeline: ${err.message}`);
  });

  res.status(202).json({ jobId });
}

function getStatusRoute(req, res) {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
}

module.exports = { triggerIngestRoute, getStatusRoute };