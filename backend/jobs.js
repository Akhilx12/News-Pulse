const crypto = require("crypto");

//in memory store: { jobId: { status, startedAt, finishedAt, error } }
//resets on server restart
const jobs = {};

function createJob() {
  const jobId = crypto.randomUUID(); //it will generate a unique id like a1b2.. which the frontend will use to poll the status
  jobs[jobId] = {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  };
  return jobId;
}

function completeJob(jobId) {
  if (jobs[jobId]) {
    jobs[jobId].status = "completed";
    jobs[jobId].finishedAt = new Date().toISOString();
  }
}

function failJob(jobId, errorMessage) {
  if (jobs[jobId]) {
    jobs[jobId].status = "failed";
    jobs[jobId].finishedAt = new Date().toISOString();
    jobs[jobId].error = errorMessage;
  }
}

function getJob(jobId) {
  return jobs[jobId] || null;
}

module.exports = { createJob, completeJob, failJob, getJob };