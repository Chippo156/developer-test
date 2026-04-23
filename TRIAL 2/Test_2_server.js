// ============================================================
// Launchmen Task API
// Developer Candidate Test — Trial 2
// ============================================================
// Instructions:
//   Run with: npm install && node server.js
//   Server starts on: http://localhost:3000
// ============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const DB_FILE = path.join(__dirname, "tasks.json");

function loadTasks() {
  if (!fs.existsSync(DB_FILE)) return [];
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

// GET /tasks
// Returns all tasks. Supports optional status filter.
app.get("/tasks", (req, res) => {
  const tasks = loadTasks();
  const { status } = req.query;
  // Edge case decision: reject repeated ?status= values to avoid ambiguous filtering behavior.
  if (Array.isArray(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Use a single status query value" });
  }

  if (typeof status === "string" && status.trim() !== "") {
    const filtered = tasks.filter((t) => t.status === status.trim());
    return res.json({ success: true, tasks: filtered });
  }

  res.json({ success: true, tasks });
});

// POST /tasks
app.post("/tasks", (req, res) => {
  const { title, status } = req.body;
  const normalizedTitle = typeof title === "string" ? title.trim() : "";

  if (!normalizedTitle) {
    return res
      .status(400)
      .json({ success: false, message: "title is required" });
  }

  const tasks = loadTasks();

  let id = Date.now();
  while (tasks.some((t) => t.id === id)) {
    id += 1;
  }

  const newTask = {
    id,
    title: normalizedTitle,
    status:
      typeof status === "string" && status.trim() ? status.trim() : "pending",
  };

  tasks.push(newTask);
  saveTasks(tasks);
  res.status(201).json({ success: true, task: newTask });
});

// PATCH /tasks/:id
app.patch("/tasks/:id", (req, res) => {
  const tasks = loadTasks();
  const { status } = req.body;
  const id = Number(req.params.id);
  const nextStatus = typeof status === "string" ? status.trim() : "";

  if (!nextStatus) {
    return res
      .status(400)
      .json({ success: false, message: "status is required" });
  }

  const task = tasks.find((t) => t.id === id);
  if (!task || !Number.isInteger(id)) {
    return res.status(404).json({ success: false, message: "Task not found" });
  }

  task.status = nextStatus;
  saveTasks(tasks);
  res.json({ success: true, task });
});

// DELETE /tasks/:id
app.delete("/tasks/:id", (req, res) => {
  const tasks = loadTasks();
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1 || !Number.isInteger(id)) {
    return res.status(404).json({ success: false, message: "Task not found" });
  }

  tasks.splice(index, 1);
  saveTasks(tasks);
  res.json({ success: true, message: "Task deleted" });
});

app.listen(3000, () => {
  console.log("Launchmen Task API running on http://localhost:3000");
});
