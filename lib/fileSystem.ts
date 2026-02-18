import { MemoryFile } from '../types';

/**
 * Simulates a local file system.
 * 
 * [AI AGENT DIRECTIVE]:
 * To upgrade this to a real local-first app:
 * 1. Create a Next.js API route or Express server.
 * 2. Replace these methods with fetch() calls to your backend.
 * 3. Map 'readFile' to `fs.readFileSync` and 'writeFile' to `fs.writeFileSync`.
 */
class MockFileSystem {
  private storageKey = 'openclaw_fs_v1';
  private initialData: MemoryFile[] = [
    {
      name: 'OPENCLAW_MANUAL.md',
      type: 'md',
      lastModified: new Date().toISOString(),
      content: `# OpenCLAW Operating Manual

## Identity
I am an autonomous agent visualized through this dashboard.

## Core Directives
1. **Maintain Persistence:** Ensure all thoughts and tasks are written to .json or .md files.
2. **Optimize Costs:** Use "Flash" models for routine tasks and "Opus" for complex reasoning.
3. **Seek Approval:** Dangerous tools (Twitter, Shell) require human confirmation in the 'Approvals' tab.

## Self-Improvement
To upgrade my own dashboard, I should edit the React components in the /pages directory.
`
    },
    {
      name: 'active_sessions.json',
      type: 'json',
      lastModified: new Date().toISOString(),
      content: JSON.stringify([])
    },
    {
      name: 'settings.json',
      type: 'json',
      lastModified: new Date().toISOString(),
      content: JSON.stringify({
        models: [
          { taskType: "Strategic Planning", selectedModel: "Claude 3 Opus", fallbackModel: "GPT-4" },
          { taskType: "Coding Implementation", selectedModel: "Claude 3.5 Sonnet", fallbackModel: "CodeLlama 70B" },
          { taskType: "Data Research", selectedModel: "Perplexity Online", fallbackModel: "Gemini Pro" },
          { taskType: "Creative Writing", selectedModel: "Gemini 1.5 Flash", fallbackModel: "GPT-3.5" }
        ],
        tools: [
          { id: "t1", name: "Web Search", description: "Access live internet data via Google/Perplexity.", enabled: true, riskLevel: "safe", requiresApproval: false },
          { id: "t2", name: "File System Write", description: "Create and modify local files.", enabled: true, riskLevel: "moderate", requiresApproval: false },
          { id: "t3", name: "Git Commit & Push", description: "Push code to remote repositories.", enabled: true, riskLevel: "moderate", requiresApproval: true },
          { id: "t4", name: "Twitter/X Posting", description: "Post content to social media.", enabled: false, riskLevel: "critical", requiresApproval: true },
          { id: "t5", name: "Execute Shell Command", description: "Run arbitrary bash commands.", enabled: false, riskLevel: "critical", requiresApproval: true }
        ]
      })
    },
    {
      name: 'kanban_tasks.json',
      type: 'json',
      lastModified: new Date().toISOString(),
      content: JSON.stringify([])
    },
    {
      name: 'approvals.json',
      type: 'json',
      lastModified: new Date().toISOString(),
      content: JSON.stringify([])
    },
    {
      name: 'console_history.json',
      type: 'json',
      lastModified: new Date().toISOString(),
      content: JSON.stringify([])
    }
  ];

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      this.saveAll(this.initialData);
    }
  }

  private getAll(): MemoryFile[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(files: MemoryFile[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(files));
  }

  listFiles(): MemoryFile[] {
    return this.getAll();
  }

  readFile(fileName: string): string | null {
    const files = this.getAll();
    const file = files.find(f => f.name === fileName);
    return file ? file.content : null;
  }

  writeFile(fileName: string, content: string): void {
    const files = this.getAll();
    const index = files.findIndex(f => f.name === fileName);
    if (index >= 0) {
      files[index].content = content;
      files[index].lastModified = new Date().toISOString();
    } else {
      files.push({
        name: fileName,
        content,
        lastModified: new Date().toISOString(),
        type: fileName.endsWith('.json') ? 'json' : 'md'
      });
    }
    this.saveAll(files);
  }

  deleteFile(fileName: string): void {
    const files = this.getAll().filter(f => f.name !== fileName);
    this.saveAll(files);
  }
}

export const fileSystem = new MockFileSystem();