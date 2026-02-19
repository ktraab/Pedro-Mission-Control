import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Zap, Clock, AlertCircle } from 'lucide-react';

interface RealSession {
  key: string;
  kind: string;
  displayName: string;
  model?: string;
  contextTokens?: number;
  totalTokens?: number;
  updatedAt: number;
}

const OrgChart: React.FC = () => {
  const [sessions, setSessions] = useState<RealSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sessions', { signal: abortController.signal });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        if (isMounted) {
          setSessions(data.sessions || []);
          setError(null);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Unknown error');
          console.error('Failed to fetch sessions:', e);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  const totalTokens = sessions.reduce((acc, s) => acc + (s.totalTokens || 0), 0);
  const activeCount = sessions.filter(s => s.kind === 'subagent').length;

  const getStatus = (session: RealSession) => {
    if (session.displayName?.toLowerCase().includes('cron')) return 'scheduled';
    if (session.kind === 'subagent') return 'working';
    return 'active';
  };

  const getModelDisplay = (model?: string) => {
    if (!model) return 'Unknown';
    if (model.includes('kimi')) return 'Kimi K2.5';
    if (model.includes('claude')) return 'Claude';
    if (model.includes('gpt')) return 'GPT';
    return model.split('/').pop() || model;
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Fleet</h2>
          <p className="text-gray-400 text-sm">Live OpenClaw sessions and cron jobs</p>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-950/50 border border-red-900 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-blue-900/20 text-blue-500 rounded-lg"><Activity size={20}/></div>
          <div>
            <div className="text-2xl font-bold text-white">{loading ? '-' : sessions.length}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Total Sessions</div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-purple-900/20 text-purple-500 rounded-lg"><Zap size={20}/></div>
          <div>
            <div className="text-2xl font-bold text-white">{loading ? '-' : (totalTokens / 1000).toFixed(1)}k</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Total Tokens</div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-green-900/20 text-green-500 rounded-lg"><Clock size={20}/></div>
          <div>
            <div className="text-2xl font-bold text-white">{loading ? '-' : activeCount}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Sub-agents</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex-1">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-950 text-gray-500 uppercase text-xs font-mono">
            <tr>
              <th className="px-6 py-3">Session</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Model</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Tokens</th>
              <th className="px-6 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sessions.map((session) => (
              <tr key={session.key} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-400 truncate max-w-[200px]">
                  {session.displayName || session.key.slice(0, 20)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 text-gray-300">
                    {session.kind}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">{getModelDisplay(session.model)}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    getStatus(session) === 'working' ? 'bg-blue-900/30 text-blue-400' :
                    getStatus(session) === 'scheduled' ? 'bg-amber-900/30 text-amber-400' :
                    'bg-green-900/30 text-green-400'
                  }`}>
                    {getStatus(session)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-400">
                  {session.totalTokens?.toLocaleString() || '0'}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(session.updatedAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active sessions.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading sessions...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrgChart;
