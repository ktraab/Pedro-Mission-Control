import React, { useState, useEffect } from 'react';
import { Activity, Command, Play, Loader2, AlertCircle } from 'lucide-react';
import { LogEntry, CronJob } from '../types';

interface CronJobData extends CronJob {}

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), agent: 'System', message: 'Mission Control Online.', type: 'info' }
  ]);
  const [cronJobs, setCronJobs] = useState<CronJobData[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [cronErrors, setCronErrors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cronRes, statusRes] = await Promise.allSettled([
          fetch('/api/cron'),
          fetch('/api/status')
        ]);

        if (statusRes.status === 'fulfilled') {
          const status = await statusRes.value.json();
          setActiveSessions(status.sessions?.count || 0);
          const totalTokens = status.sessions?.recent?.reduce((acc: number, s: any) => acc + (s.totalTokens || 0), 0) || 0;
          setTokensUsed(totalTokens);
        }

        if (cronRes.status === 'fulfilled') {
          const jobs = await cronRes.value.json();
          const typedJobs: CronJobData[] = jobs.map((j: any) => ({
            id: j.id || '',
            name: j.name || 'Unnamed',
            enabled: j.enabled ?? false,
            schedule: { kind: j.schedule?.kind || 'every', everyMs: j.schedule?.everyMs },
            state: j.state
          }));
          setCronJobs(typedJobs);
          const errors = jobs.reduce((acc: number, j: any) => acc + (j.state?.consecutiveErrors || 0), 0);
          setCronErrors(errors);
          if (errors > 0) {
            setLogs(prev => [...prev.slice(-19), {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              agent: 'Cron',
              message: `${errors} error(s) in cron jobs`,
              type: 'error'
            }]);
          }
        }
      } catch (e) {
        console.error('Dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRunJob = async (id: string) => {
    setRunningJob(id);
    try {
      await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', jobId: id })
      });
      setLogs(prev => [...prev.slice(-19), {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        agent: 'Cron',
        message: `Triggered job`,
        type: 'success'
      }]);
    } finally {
      setRunningJob(null);
    }
  };

  const formatTime = (ms?: number) => {
    if (!ms) return 'Never';
    const diff = Date.now() - ms;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ms).toLocaleDateString();
  };

  const getStatusColor = (job: CronJobData) => {
    if (!job.enabled) return 'bg-gray-600';
    if (job.state?.consecutiveErrors && job.state.consecutiveErrors > 0) return 'bg-red-500 animate-pulse';
    if (job.state?.runningAtMs) return 'bg-blue-500 animate-pulse';
    return 'bg-green-500';
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Mission Control</h2>
          <p className="text-gray-400">OpenClaw dashboard - real-time monitoring</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {loading ? 'Connecting...' : 'Live'}
          </div>
          {cronErrors > 0 && (
            <div className="px-4 py-2 bg-red-950 border border-red-900 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {cronErrors} Error(s)
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Active Sessions</p>
          <h3 className="text-2xl font-bold text-white">{loading ? '-' : activeSessions}</h3>
          <p className="text-xs text-gray-600 mt-2">Real-time</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Cron Jobs</p>
          <h3 className="text-2xl font-bold text-white">{loading ? '-' : `${cronJobs.length} (${cronJobs.filter(j => j.enabled).length} active)`}</h3>
          <p className={`text-xs mt-2 ${cronErrors > 0 ? 'text-red-400' : 'text-gray-600'}`}>{cronErrors > 0 ? `${cronErrors} errors` : 'Nominal'}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Tokens Used</p>
          <h3 className="text-2xl font-bold text-white">{loading ? '-' : tokensUsed.toLocaleString()}</h3>
          <p className="text-xs text-gray-600 mt-2">Session activity</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Status</p>
          <h3 className="text-2xl font-bold text-white">{cronErrors > 0 ? 'Degraded' : 'Online'}</h3>
          <p className="text-xs text-green-400 mt-2">All systems operational</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Command size={14} /> Live Activity Feed
            </h3>
            <span className="text-xs text-gray-600 font-mono">{logs.length} entries</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 bg-gray-950/50">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors">
                <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                <span className={`font-bold shrink-0 w-24 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>{log.agent}</span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-950">
            <h3 className="text-sm font-semibold text-gray-300">Cron Monitor</h3>
          </div>
          <div className="p-2 space-y-2 overflow-y-auto flex-1">
            {cronJobs.length > 0 ? cronJobs.map(job => (
              <div key={job.id} className={`p-3 bg-gray-950 border rounded-lg flex items-center justify-between group transition-all ${job.state?.consecutiveErrors ? 'border-red-900/50' : 'border-gray-800'}`}>
                <div>
                  <div className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(job)}`}></div>
                    {job.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{job.enabled ? 'Running' : 'Disabled'} • Last: {formatTime(job.state?.lastRunAtMs)}</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleRunJob(job.id)} disabled={runningJob === job.id} className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${runningJob === job.id ? 'bg-blue-900/20 text-blue-400' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                    {runningJob === job.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                    {runningJob === job.id ? 'Running' : 'Run'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                <Command size={24} className="mb-2 opacity-50" />
                No active cron jobs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
