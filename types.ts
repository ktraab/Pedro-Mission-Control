export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'working' | 'error';
  model: string;
  department: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  assignedTo: string; // Agent ID
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface MemoryFile {
  name: string;
  content: string;
  lastModified: string;
  type: 'md' | 'json' | 'log';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ApprovalItem {
  id: string;
  type: 'tweet' | 'email' | 'deploy';
  content: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  enabled: boolean;
  department: string;
}

export interface ActiveSession {
  id: string;
  taskId: string;
  agentName: string;
  model: string;
  status: 'generating' | 'reasoning' | 'waiting';
  tokensUsed: number;
  currentCost: number;
  startedAt: string;
}

export interface ModelConfig {
  taskType: string;
  selectedModel: string;
  fallbackModel?: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  riskLevel: 'safe' | 'moderate' | 'critical';
  requiresApproval: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  text: string;
  timestamp: string;
  isThinking?: boolean;
}
