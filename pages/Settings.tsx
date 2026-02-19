import React, { useEffect, useState } from 'react';
import { Brain, Cpu, Code, Database, PenTool, RefreshCw, Clock, Users, Folder } from 'lucide-react';

interface OpenClawModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
}

interface OpenClawAgent {
  id: string;
  alias: string;
  primary: boolean;
}

interface OpenClawSettings {
  workspace: string;
  timeoutSeconds: number;
  maxConcurrent: number;
  subagentMaxConcurrent: number;
  models: OpenClawModel[];
  agents: OpenClawAgent[];
  primaryModel: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<OpenClawSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'models' | 'system'>('models');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'nvidia-nim': return <Brain size={16} className="text-green-400" />;
      case 'ollama': return <Cpu size={16} className="text-blue-400" />;
      default: return <Cpu size={16} />;
    }
  };

  const getAgentIcon = (alias: string) => {
    if (alias.includes('kimi')) return <Brain size={16} className="text-purple-400" />;
    if (alias.includes('dev') || alias.includes('coder')) return <Code size={16} className="text-blue-400" />;
    if (alias.includes('lib') || alias.includes('phi')) return <Database size={16} className="text-green-400" />;
    if (alias.includes('think') || alias.includes('qwen')) return <PenTool size={16} className="text-amber-400" />;
    if (alias.includes('fast') || alias.includes('llama')) return <Cpu size={16} className="text-cyan-400" />;
    return <Cpu size={16} />;
  };

  const getAgentRole = (alias: string) => {
    const roles: Record<string, string> = {
      'kimi': 'CEO-Alpha (Strategic Planning)',
      'minimax': 'CEO-Beta (High-level decisions)',
      'qwen-think': 'The Thinker (Deep Reasoning)',
      'qwen-sys': 'The SysAdmin (System Tools)',
      'qwen-dev': 'The Developer (Code/Scripts)',
      'phi-lib': 'The Librarian (RAG/Docs)',
      'llama-fast': 'Fast Chat (Quick Tasks)',
      'gatekeeper': 'Gatekeeper (Triage/Routing)'
    };
    return roles[alias] || alias;
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n/1000).toFixed(0)}k`;
    return n.toString();
  };

  const formatTimeout = (seconds: number) => {
    if (seconds >= 3600) return `${seconds/3600}h`;
    if (seconds >= 60) return `${seconds/60}m`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p>Loading OpenClaw configuration...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>Failed to load settings.</p>
        <button onClick={fetchSettings} className="mt-4 px-4 py-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
          <RefreshCw size={14} className="inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">System Configuration</h2>
          <p className="text-gray-400 text-sm">Live OpenClaw configuration from ~/.openclaw/openclaw.json</p>
        </div>
        <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-800 mb-6">
        <button onClick={() => setActiveTab('models')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${ activeTab === 'models' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300' }`}>
          Agent Models
        </button>
        <button onClick={() => setActiveTab('system')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${ activeTab === 'system' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300' }`}>
          System Settings
        </button>
      </div>

      {activeTab === 'models' ? (
        <div className="space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              Your Agent Organization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.agents.map((agent) => (
                <div key={agent.id} className={`p-4 rounded-lg border ${agent.primary ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                      {getAgentIcon(agent.alias)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{agent.alias}</span>
                        {agent.primary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white">PRIMARY</span>}
                      </div>
                      <div className="text-xs text-gray-400">{getAgentRole(agent.alias)}</div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{agent.id.split('/').pop()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-green-400" />
              Available Models ({settings.models.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-950 text-gray-500 uppercase text-xs font-mono">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Context</th>
                    <th className="px-4 py-3">Max Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {settings.models.map((model) => (
                    <tr key={model.id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 flex items-center gap-2">
                        {getProviderIcon(model.provider)}
                        <span className="text-white">{model.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{model.provider}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{formatNumber(model.contextWindow)}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{formatNumber(model.maxTokens)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Folder size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Workspace</span>
              </div>
              <div className="text-xs text-gray-400 font-mono break-all">{settings.workspace}</div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-gray-300">Timeout</span>
              </div>
              <div className="text-xl font-bold text-white">{formatTimeout(settings.timeoutSeconds)}</div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-green-400" />
                <span className="text-sm font-medium text-gray-300">Max Concurrent</span>
              </div>
              <div className="text-xl font-bold text-white">{settings.maxConcurrent} main</div>
              <div className="text-xs text-gray-500">{settings.subagentMaxConcurrent} subagents</div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Primary Model</span>
              </div>
              <div className="text-sm font-bold text-white break-all">{settings.primaryModel}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;