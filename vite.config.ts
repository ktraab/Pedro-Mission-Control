import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import fs from "fs";

const WORKSPACE = "/home/pedro-openclaw/.openclaw/workspace";
const MEMORY_DIR = path.join(WORKSPACE, "memory");
const TASKS_FILE = path.join(WORKSPACE, "kanban_tasks.json");
const APPROVALS_FILE = path.join(WORKSPACE, "approvals.json");
const OPENCLAW_CONFIG = "/home/pedro-openclaw/.openclaw/openclaw.json";

// SECURITY: Input validation helpers
const sanitizeJobId = (id: string): string | null => {
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized === id && id.length > 0 ? sanitized : null;
};

const escapeShellArg = (arg: string): string => {
  return arg.replace(/[\`$"\\]/g, "\\$&");
};

const isValidPath = (p: string): boolean => {
  return !p.includes("..") && !p.includes("//");
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      configureServer(server) {
        // Tasks API
        server.middlewares.use("/api/tasks", async (req, res, next) => {
          if (req.method === "GET") {
            try {
              if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, "[]");
              const data = fs.readFileSync(TASKS_FILE, "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(data);
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to read tasks" }));
            }
          } else if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              try {
                const data = JSON.parse(body || "{}");
                let tasks: any[] = [];
                if (fs.existsSync(TASKS_FILE)) {
                  tasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
                }
                if (data.action === "create") {
                  const newTask = {
                    id: Date.now().toString(),
                    title: String(data.title || "").slice(0, 500),
                    status: data.status || "backlog",
                    priority: data.priority || "medium",
                  };
                  tasks.push(newTask);
                  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
                  res.end(JSON.stringify(newTask));
                } else if (data.action === "update" && data.id) {
                  const task = tasks.find((t: any) => t.id === data.id);
                  if (task) Object.assign(task, { status: data.status });
                  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "Invalid action" }));
                }
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to update tasks" }));
              }
            });
          } else next();
        });

        // Cron API - with SECURITY FIX
        server.middlewares.use("/api/cron", async (req, res, next) => {
          if (req.method === "GET") {
            try {
              const output = execSync(
                'openclaw cron list --json 2>/dev/null || echo "[]"',
                { encoding: "utf-8" }
              );
              res.setHeader("Content-Type", "application/json");
              res.end(output);
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to fetch cron jobs" }));
            }
          } else if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              try {
                const data = JSON.parse(body);
                if (data.action === "run" && data.jobId) {
                  const sanitizedJobId = sanitizeJobId(String(data.jobId));
                  if (!sanitizedJobId) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: "Invalid jobId format" }));
                    return;
                  }
                  execSync(`openclaw cron run ${sanitizedJobId}`, {
                    encoding: "utf-8",
                  });
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "Invalid action" }));
                }
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to run job" }));
              }
            });
          } else next();
        });

        server.middlewares.use("/api/sessions", async (req, res, next) => {
          if (req.method !== "GET") return next();
          try {
            const output = execSync(
              'openclaw sessions list --json 2>/dev/null || echo "{}"',
              { encoding: "utf-8" }
            );
            res.setHeader("Content-Type", "application/json");
            res.end(output);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to fetch sessions" }));
          }
        });

        // Files API - with SECURITY FIX
        server.middlewares.use("/api/files/content", async (req, res, next) => {
          if (req.method === "GET") {
            const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const filePath = url.searchParams.get("path");
            if (!filePath) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: "Missing path" }));
            }
            if (!isValidPath(filePath)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: "Invalid path" }));
            }
            try {
              const fullPath = filePath.startsWith("/memory/")
                ? path.join(MEMORY_DIR, filePath.replace("/memory/", ""))
                : path.join(WORKSPACE, filePath.replace("/workspace/", ""));
              const content = fs.readFileSync(fullPath, "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ content }));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to read" }));
            }
          } else if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              try {
                const data = JSON.parse(body);
                if (data.path && data.content !== undefined) {
                  if (!isValidPath(data.path)) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ error: "Invalid path" }));
                  }
                  const fullPath = data.path.startsWith("/memory/")
                    ? path.join(MEMORY_DIR, data.path.replace("/memory/", ""))
                    : path.join(WORKSPACE, data.path.replace("/workspace/", ""));
                  fs.writeFileSync(fullPath, data.content, "utf-8");
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "Missing path/content" }));
                }
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to write" }));
              }
            });
          } else next();
        });

        server.middlewares.use("/api/files", async (req, res, next) => {
          if (req.method !== "GET") return next();
          try {
            const files: any[] = [];
            const rootFiles = fs.readdirSync(WORKSPACE).filter((f: string) => f.endsWith(".md"));
            for (const name of rootFiles) {
              const stats = fs.statSync(path.join(WORKSPACE, name));
              files.push({ name, path: `/workspace/${name}`, modified: stats.mtime.toISOString().split("T")[0], folder: "root", size: stats.size });
            }
            if (fs.existsSync(MEMORY_DIR)) {
              const memFiles = fs.readdirSync(MEMORY_DIR).filter((f: string) => f.endsWith(".md"));
              for (const name of memFiles) {
                const stats = fs.statSync(path.join(MEMORY_DIR, name));
                files.push({ name, path: `/memory/${name}`, modified: stats.mtime.toISOString().split("T")[0], folder: "memory", size: stats.size });
              }
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(files));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to fetch files" }));
          }
        });

        // Spawn API - with SECURITY FIX
        server.middlewares.use("/api/spawn", async (req, res, next) => {
          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              try {
                const data = JSON.parse(body || "{}");
                const task = String(data.task || "Hello from Mission Control").slice(0, 2000);
                const label = String(data.label || "MC Agent").slice(0, 100);
                const escapedTask = escapeShellArg(task);
                const escapedLabel = escapeShellArg(label);
                const output = execSync(
                  `openclaw sessions spawn "${escapedTask}" --label "${escapedLabel}" --agent-id main --json`,
                  { encoding: "utf-8", timeout: 30000 }
                );
                const result = JSON.parse(output);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, sessionKey: result.sessionKey, agentId: result.agentId }));
              } catch (e) {
                console.error("Spawn error:", e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to spawn agent", details: String(e) }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
          }
        });

        // Approvals API
        server.middlewares.use("/api/approvals", async (req, res, next) => {
          if (req.method === "GET") {
            try {
              if (!fs.existsSync(APPROVALS_FILE)) fs.writeFileSync(APPROVALS_FILE, "[]");
              const data = fs.readFileSync(APPROVALS_FILE, "utf-8");
              const approvals = JSON.parse(data);
              const pendingOnly = req.url?.includes("?status=pending");
              const result = pendingOnly ? approvals.filter((a: any) => a.status === "pending") : approvals;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to read approvals" }));
            }
          } else if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              try {
                const data = JSON.parse(body || "{}");
                const approvals = fs.existsSync(APPROVALS_FILE) 
                  ? JSON.parse(fs.readFileSync(APPROVALS_FILE, "utf-8")) 
                  : [];
                if (data.action === "create") {
                  const newApproval = {
                    id: Date.now().toString(),
                    type: String(data.type || "shell").slice(0, 50),
                    content: String(data.content || "").slice(0, 10000),
                    requestedBy: String(data.requestedBy || "Console").slice(0, 100),
                    status: "pending",
                    toolId: data.toolId,
                    sessionKey: data.sessionKey,
                    createdAt: new Date().toISOString()
                  };
                  approvals.push(newApproval);
                  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(approvals, null, 2));
                  res.end(JSON.stringify(newApproval));
                } else if (data.action === "update" && data.id) {
                  const approval = approvals.find((a: any) => a.id === data.id);
                  if (approval) {
                    approval.status = ["approved", "rejected"].includes(data.status) ? data.status : "pending";
                    if (approval.status !== "pending") approval.resolvedAt = new Date().toISOString();
                    fs.writeFileSync(APPROVALS_FILE, JSON.stringify(approvals, null, 2));
                    res.end(JSON.stringify({ success: true, approval }));
                  } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: "Approval not found" }));
                  }
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "Invalid action" }));
                }
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to update approvals" }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
          }
        });

        // Settings API
        server.middlewares.use("/api/settings", async (req, res, next) => {
          if (req.method === "GET") {
            try {
              const config = fs.existsSync(OPENCLAW_CONFIG) 
                ? JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, "utf-8"))
                : {};
              const models: any[] = [];
              const agents: any[] = [];
              if (config.models?.providers) {
                for (const [provider, pdata] of Object.entries(config.models.providers)) {
                  const p = pdata as any;
                  if (p.models) {
                    for (const m of p.models) {
                      models.push({ id: m.id, name: m.name || m.id, provider, contextWindow: m.contextWindow || 0, maxTokens: m.maxTokens || 0, reasoning: m.reasoning || false });
                    }
                  }
                }
              }
              if (config.agents?.defaults?.models) {
                for (const [modelId, mdata] of Object.entries(config.agents.defaults.models)) {
                  const m = mdata as any;
                  agents.push({ id: modelId, alias: m.alias, primary: modelId === config.agents.defaults.model?.primary });
                }
              }
              const settings = {
                workspace: config.agents?.defaults?.workspace || WORKSPACE,
                timeoutSeconds: config.agents?.defaults?.timeoutSeconds
 || 3600,
                maxConcurrent: config.agents?.defaults?.maxConcurrent || 4,
                subagentMaxConcurrent: config.agents?.defaults?.subagents?.maxConcurrent || 8,
                models,
                agents,
                primaryModel: config.agents?.defaults?.model?.primary
              };
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(settings));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to read settings" }));
            }
          } else next();
        });

        server.middlewares.use("/api/status", async (req, res, next) => {
          if (req.method !== "GET") return next();
          try {
            const output = execSync("openclaw status --json 2>/dev/null || echo '{}'", { encoding: "utf-8" });
            res.setHeader("Content-Type", "application/json");
            res.end(output);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to fetch status" }));
          }
        });
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});