import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      configureServer(server) {
        // API middleware for OpenClaw integration
        server.middlewares.use('/api/cron', async (req, res, next) => {
          if (req.method === 'GET') {
            try {
              const output = execSync('openclaw cron list --json 2>/dev/null || echo "[]"', { encoding: 'utf-8' });
              res.setHeader('Content-Type', 'application/json');
              res.end(output);
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch cron jobs' }));
            }
          } else if (req.method === 'POST') {
            // Handle POST to trigger/run jobs
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
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to run job' }));
              }
            });
          } else {
            next();
          }
        });

        server.middlewares.use('/api/sessions', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const output = execSync('openclaw sessions list --json 2>/dev/null || echo "{}"', { encoding: 'utf-8' });
            res.setHeader('Content-Type', 'application/json');
            res.end(output);
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch sessions' }));
          }
        });

        server.middlewares.use('/api/files', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const fs = require('fs');
            const { join } = require('path');
            const WORKSPACE = '/home/pedro-openclaw/.openclaw/workspace';
            const MEMORY_DIR = join(WORKSPACE, 'memory');
            const files: any[] = [];

            // Read root files
            const rootFiles = fs.readdirSync(WORKSPACE);
            for (const name of rootFiles.filter((f: string) => f.endsWith('.md'))) {
              const stats = fs.statSync(join(WORKSPACE, name));
              files.push({
                name,
                path: `/workspace/${name}`,
                modified: stats.mtime.toISOString().split('T')[0],
                folder: 'root'
              });
            }

            // Read memory directory
            try {
              const memFiles = fs.readdirSync(MEMORY_DIR);
              for (const name of memFiles.filter((f: string) => f.endsWith('.md'))) {
                const stats = fs.statSync(join(MEMORY_DIR, name));
                files.push({
                  name,
                  path: `/memory/${name}`,
                  modified: stats.mtime.toISOString().split('T')[0],
                  folder: 'memory'
                });
              }
            } catch {}

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(files));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch files' }));
          }
        });

        server.middlewares.use('/api/status', async (req, res, next) => {
          if (req.method !== 'GET') return next();
          try {
            const output = execSync('openclaw status --json 2>/dev/null || echo "{}"', { encoding: 'utf-8' });
            res.setHeader('Content-Type', 'application/json');
            res.end(output);
          } catch (e) {
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
