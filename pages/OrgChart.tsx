import React, { useState, useEffect } from 'react';
import { Agent, ActiveSession } from '../types';
import { Cpu, Code, PenTool, TrendingUp, Search, Activity, Zap, Clock } from 'lucide-react';
import { fileSystem } from '../lib/fileSystem';

const OrgChart: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hierarchy' | 'resources'>('hierarchy');
    const [sessions, setSessions] = useState<ActiveSession[]>([]);

    useEffect(() => {
        // Load active sessions from pseudo-DB
        const sessionFile = fileSystem.readFile('active_sessions.json');
        if (sessionFile) {
            try {
                setSessions(JSON.parse(sessionFile));
            } catch (e) {
                console.error("Failed to parse sessions", e);
            }
        }
    }, []);

    const agents: Agent[] = [
        { id: '1', name: 'Muddy (CEO)', role: 'Orchestrator', status: 'active', model: 'Claude Opus', department: 'Executive', avatarColor: 'bg-indigo-600' },
        { id: '2', name: 'CodeEx', role: 'Lead Engineer', status: 'working', model: 'GPT-4-Turbo', department: 'Engineering', avatarColor: 'bg-emerald-600' },
        { id: '3', name: 'Rex', role: 'Script Writer', status: 'idle', model: 'Claude 3.5 Sonnet', department: 'Content', avatarColor: 'bg-rose-600' },
        { id: '4', name: 'Sage', role: 'Researcher', status: 'active', model: 'Gemini 1.5 Pro', department: 'Research', avatarColor: 'bg-amber-600' },
        { id: '5', name: 'Scout', role: 'Trend Analyst', status: 'idle', model: 'Perplexity', department: 'Growth', avatarColor: 'bg-cyan-600' },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Agent Fleet</h2>
                    <p className="text-gray-400 text-sm">Manage hierarchy and monitor resource consumption.</p>
                </div>
                
                {/* Tabs */}
                <div className="bg-gray-900 p-1 rounded-lg border border-gray-800 flex">
                    <button 
                        onClick={() => setActiveTab('hierarchy')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'hierarchy' 
                            ? 'bg-gray-800 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Hierarchy
                    </button>
                    <button 
                        onClick={() => setActiveTab('resources')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'resources' 
                            ? 'bg-gray-800 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Resources & Costs
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'hierarchy' ? (
                    <HierarchyView agents={agents} />
                ) : (
                    <ResourceMonitor sessions={sessions} />
                )}
            </div>
        </div>
    );
};

const HierarchyView: React.FC<{ agents: Agent[] }> = ({ agents }) => (
    <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-500">
        {/* CEO Level */}
        <AgentCard agent={agents[0]} icon={Cpu} isBig />

        <div className="w-px h-8 bg-gray-700"></div>
        <div className="w-3/4 h-px bg-gray-700 relative">
                <div className="absolute top-0 left-0 w-px h-4 bg-gray-700 transform translate-y-0"></div>
                <div className="absolute top-0 right-0 w-px h-4 bg-gray-700 transform translate-y-0"></div>
                <div className="absolute top-0 left-1/4 w-px h-4 bg-gray-700 transform translate-y-0 ml-8"></div>
                <div className="absolute top-0 right-1/4 w-px h-4 bg-gray-700 transform translate-y-0 mr-8"></div>
        </div>

        {/* Direct Reports */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
            <div className="flex flex-col items-center">
                <div className="h-4 w-px bg-gray-700 mb-2"></div>
                <AgentCard agent={agents[1]} icon={Code} />
            </div>
            <div className="flex flex-col items-center">
                <div className="h-4 w-px bg-gray-700 mb-2"></div>
                <AgentCard agent={agents[2]} icon={PenTool} />
            </div>
            <div className="flex flex-col items-center">
                <div className="h-4 w-px bg-gray-700 mb-2"></div>
                <AgentCard agent={agents[3]} icon={Search} />
            </div>
            <div className="flex flex-col items-center">
                <div className="h-4 w-px bg-gray-700 mb-2"></div>
                <AgentCard agent={agents[4]} icon={TrendingUp} />
            </div>
        </div>
    </div>
);

const ResourceMonitor: React.FC<{ sessions: ActiveSession[] }> = ({ sessions }) => (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-blue-900/20 text-blue-500 rounded-lg"><Activity size={20}/></div>
                <div>
                    <div className="text-2xl font-bold text-white">{sessions.length}</div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Active Threads</div>
                </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-purple-900/20 text-purple-500 rounded-lg"><Zap size={20}/></div>
                <div>
                    <div className="text-2xl font-bold text-white">
                        {(sessions.reduce((acc, s) => acc + s.tokensUsed, 0) / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Total Tokens</div>
                </div>
            </div>
             <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-green-900/20 text-green-500 rounded-lg"><Clock size={20}/></div>
                <div>
                    <div className="text-2xl font-bold text-white">$0.19</div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Session Cost</div>
                </div>
            </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-950 text-gray-500 uppercase text-xs font-mono">
                    <tr>
                        <th className="px-6 py-3">Session ID</th>
                        <th className="px-6 py-3">Agent</th>
                        <th className="px-6 py-3">Model</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Tokens</th>
                        <th className="px-6 py-3 text-right">Cost</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{session.id}</td>
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neon-blue"></div>
                                {session.agentName}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700">{session.model}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    session.status === 'reasoning' ? 'bg-purple-900/30 text-purple-400' :
                                    session.status === 'generating' ? 'bg-green-900/30 text-green-400' :
                                    'bg-gray-800 text-gray-400'
                                }`}>
                                    {session.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-400">{session.tokensUsed}</td>
                            <td className="px-6 py-4 text-right font-mono text-neon-green">${session.currentCost.toFixed(4)}</td>
                        </tr>
                    ))}
                    {sessions.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                No active sessions running.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const AgentCard: React.FC<{ agent: Agent, icon: any, isBig?: boolean }> = ({ agent, icon: Icon, isBig }) => (
    <div className={`relative bg-gray-900 border ${isBig ? 'border-neon-blue shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-gray-800'} rounded-xl p-5 flex flex-col items-center text-center w-full max-w-[240px] transition-all hover:-translate-y-1 hover:border-gray-600`}>
        
        <div className={`${isBig ? 'w-16 h-16' : 'w-12 h-12'} rounded-full ${agent.avatarColor} flex items-center justify-center mb-3 text-white`}>
            <Icon size={isBig ? 32 : 20} />
        </div>
        
        <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-white ${isBig ? 'text-lg' : 'text-md'}`}>{agent.name}</h3>
            <div className={`w-2 h-2 rounded-full ${
                agent.status === 'active' || agent.status === 'working' 
                ? 'bg-neon-green shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                : 'bg-gray-600'
            }`} />
        </div>

        <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">{agent.role}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-800 w-full">
            <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>Model</span>
                <span className="text-gray-300">{agent.model}</span>
            </div>
        </div>
    </div>
);

export default OrgChart;