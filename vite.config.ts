import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';

const WORKSPACE = '/home/pedro-openclaw/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const TASKS_FILE = path.join(WORKSPACE, 'kanban_tasks.json');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      configureServer(server) {
        // Tasks API for Kanban board
        server.middlewares.use('/api/tasks', async (req, res, next) => {
          if (req.method === 'GET') {
            try {
              if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');
              const data = fs.readFileSync(TASKS_FILE, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to read tasks' }));
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                let tasks: any[] = [];
                if (fs.existsSync(TASKS_FILE)) {
                  tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
                }
                if (data.action === 'create') {
                  const newTask = { 
                    id: Date.now().toString(), 
                    title: data.title, 
                    status: data.status || 'backlog', 
                    priority: data.priority || 'medium' 
                  };
                  tasks.push(newTask);
                  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
                  res.end(JSON.stringify(newTask));
                } else if (data.action === 'update' && data.id) {
                  const task = tasks.find((t: any) => t.id === data.id);
                  if (task) Object.assign(task, { status: data.status });
                  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid action' }));
                }
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to update tasks' }));
              }
            });
          } else next();
        });

        // Cron jobs API
        server.middlewares.use('/api/cron', async (req, res, next) => {
          if (req.method === 'GET') {
            try {
              const output = execSync('openclaw cron list --json 2>/dev/null || echo "[]"', { encoding: 'utf-8' });
              res.setHeader('Content-Type', 'application/json');
              res.end(output);
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch cron jobs' }));
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (data.action === 'run' && data.jobId) {
                  execSync(`openclaw cron run ${data.jobId}`, { encoding: 'utf-8' });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid action' }));
                }
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to run job' }));
              }
            });
          } else next();
        });

        server.middlewares.use('/api/sessions', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const output = execSync('openclaw sessions list --json 2>/dev/null || echo "{}"', { encoding: 'utf-8' });
            res.setHeader('Content-Type', 'application/json');
            res.end(output);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch sessions' }));
          }
        });

        server.middlewares.use('/api/files/content', async (req, res, next) => {
          if (req.method === 'GET') {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const filePath = url.searchParams.get('path');
            if (!filePath) { 
              res.statusCode = 400; 
              return res.end(JSON.stringify({ error: 'Missing path' })); 
            }
            try {
              const fullPath = filePath.startsWith('/memory/') 
                ? path.join(MEMORY_DIR, filePath.replace('/memory/', '')) 
                : path.join(WORKSPACE, filePath.replace('/workspace/', ''));
              const content = fs.readFileSync(fullPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ content }));
            } catch { 
              res.statusCode = 500; 
              res.end(JSON.stringify({ error: 'Failed to read' })); 
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (data.path && data.content !== undefined) {
                  const fullPath = data.path.startsWith('/memory/') 
                    ? path.join(MEMORY_DIR, data.path.replace('/memory/', '')) 
                    : path.join(WORKSPACE, data.path.replace('/workspace/', ''));
                  fs.writeFileSync(fullPath, data.content, 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } else { 
                  res.statusCode = 400; 
                  res.end(JSON.stringify({ error: 'Missing path/content' })); 
                }
              } catch { 
                res.statusCode = 500; 
                res.end(JSON.stringify({ error: 'Failed to write' })); 
              }
            });
          } else next();
        });

        server.middlewares.use('/api/files', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const files: any[] = [];
            const rootFiles = fs.readdirSync(WORKSPACE).filter((f: string) => f.endsWith('.md'));
            for (const name of rootFiles) {
              const stats = fs.statSync(path.join(WORKSPACE, name));
              files.push({ 
                name, 
                path: `/workspace/${name}`, 
                modified: stats.mtime.toISOString().split('T')[0], 
                folder: 'root', 
                size: stats.size 
              });
            }
            if (fs.existsSync(MEMORY_DIR)) {
              const memFiles = fs.readdirSync(MEMORY_DIR).filter((f: string) => f.endsWith('.md'));
              for (const name of memFiles) {
                const stats = fs.statSync(path.join(MEMORY_DIR, name));
                files.push({ 
                  name, 
                  path: `/memory/${name}`, 
                  modified: stats.mtime.toISOString().split('T')[0], 
                  folder: 'memory', 
                  size: stats.size 
                });
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(files));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch files' }));
          }
        });

        // Spawn agent via OpenClaw CLI
      server.middlewares.use('/api/spawn', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const task = data.task || 'Hello from Mission Control';
              const label = data.label || 'MC Agent';
              
              // Spawn the agent using OpenClaw CLI
              const output = execSync(
                `openclaw sessions spawn "${task.replace(/"/g, '\\"')}" --label "${label.replace(/"/g, '\\"')}" --agent-id main --json`,
                { encoding: 'utf-8', timeout: 30000 }
              );
              
              const result = JSON.parse(output);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                sessionKey: result.sessionKey,
                agentId: result.agentId 
              }));
            } catch (e) {
              console.error('Spawn error:', e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to spawn agent', details: String(e) }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      server.middlewares.use('/api/status', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const output = execSync("openclaw status --json 2>/dev/null || echo '{}'", { encoding: 'utf-8' });
            res.setHeader('Content-Type', 'application/json');
            res.end(output);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch status' }));
          }
        });
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
