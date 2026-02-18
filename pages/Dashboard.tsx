import React, { useState } from 'react';
import { Activity, DollarSign, Database, Cpu, Command, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { LogEntry, CronJob } from '../types';

const Dashboard: React.FC = () => {
  const [logs] = useState<LogEntry[]>([
    { id: '1', timestamp: '10:42:01', agent: 'System', message: 'Syncing local memory...', type: 'info' },
    { id: '2', timestamp: '10:42:05', agent: 'Claude Opus', message: 'Analyzing "Project Titan" requirements.', type: 'info' },
    { id: '3', timestamp: '10:42:12', agent: 'Gemini Flash', message: 'Summarized 15 news articles.', type: 'success' },
    { id: '4', timestamp: '10:43:00', agent: 'CodeEx', message: 'Deploying hotfix to staging.', type: 'warning' },
  ]);

  const [cronJobs, setCronJobs] = useState<CronJob[]>([
    { id: 'c1', name: 'Morning Lab Brief', schedule: '08:00 AM', lastRun: '2 hours ago', nextRun: '22 hours', enabled: true, department: 'Research' },
    { id: 'c2', name: 'Nightly $1B Research', schedule: '03:00 AM', lastRun: '7 hours ago', nextRun: '17 hours', enabled: true, department: 'Growth' },
    { id: 'c3', name: 'Git Backup', schedule: '05:00 AM', lastRun: '5 hours ago', nextRun: '19 hours', enabled: true, department: 'DevOps' },
  ]);

  const [runningJob, setRunningJob] = useState<string | null>(null);

  const handleRunJob = (id: string) => {
    setRunningJob(id);
    setTimeout(() => {
        setRunningJob(null);
        setCronJobs(prev => prev.map(job => 
            job.id === id ? { ...job, lastRun: 'Just now' } : job
        ));
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Good Morning, Human.</h2>
          <p className="text-gray-400">System operating at 98% efficiency. 12 active threads.</p>
        </div>
        <div className="flex gap-4">
            <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg flex items-center gap-2 text-neon-green text-sm font-mono">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                Live Connection
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Active Sessions" value="12" icon={Activity} color="text-neon-blue" sub="3 idle" />
        <KpiCard title="Est. Cost (24h)" value="$4.32" icon={DollarSign} color="text-neon-green" sub="+12% vs yesterday" />
        <KpiCard title="Tokens Used" value="1.2M" icon={Database} color="text-neon-purple" sub="Claude Opus heavy" />
        <KpiCard title="CPU Load" value="34%" icon={Cpu} color="text-neon-amber" sub="Local Llama inference" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* Terminal / Live Activity */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Command size={14} /> Live Activity Feed
            </h3>
            <span className="text-xs text-gray-600 font-mono">tail -f /logs/system.log</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 bg-gray-950/50">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors">
                <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                <span className={`font-bold shrink-0 w-24 ${
                   log.type === 'error' ? 'text-neon-red' : 
                   log.type === 'warning' ? 'text-neon-amber' : 
                   log.type === 'success' ? 'text-neon-green' : 'text-neon-blue'
                }`}>{log.agent}</span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))}
            <div className="h-4" /> {/* Spacer */}
          </div>
        </div>

        {/* Cron Monitor */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-950">
                <h3 className="text-sm font-semibold text-gray-300">Cron Monitor</h3>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {cronJobs.map(job => (
                    <div key={job.id} className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-center justify-between group hover:border-gray-700 transition-all">
                        <div>
                            <div className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${job.enabled ? 'bg-neon-green' : 'bg-gray-600'}`}></div>
                                {job.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 font-mono">
                                Next: {job.nextRun} • {job.schedule}
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleRunJob(job.id)}
                                disabled={runningJob === job.id}
                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                                    runningJob === job.id 
                                    ? 'bg-neon-blue/20 text-neon-blue' 
                                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                                }`}
                            >
                                {runningJob === job.id ? (
                                    <><Loader2 size={10} className="animate-spin" /> Running...</>
                                ) : (
                                    <><Play size={10} /> Run</>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{title: string, value: string, icon: any, color: string, sub: string}> = ({title, value, icon: Icon, color, sub}) => (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl flex items-start justify-between relative overflow-hidden group hover:border-gray-700 transition-all">
        <div className="relative z-10">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white font-mono">{value}</h3>
            <p className="text-xs text-gray-600 mt-2">{sub}</p>
        </div>
        <div className={`p-3 bg-gray-950 rounded-lg border border-gray-800 ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={20} />
        </div>
    </div>
);

export default Dashboard;