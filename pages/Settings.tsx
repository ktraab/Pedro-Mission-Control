import React, { useEffect, useState } from 'react';
import { Save, Brain, Code, Database, PenTool, Cpu, Shield, ShieldAlert, Wrench } from 'lucide-react';
import { ModelConfig, ToolConfig } from '../types';
import { fileSystem } from '../lib/fileSystem';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'models' | 'tools'>('models');
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [toolConfigs, setToolConfigs] = useState<ToolConfig[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const data = fileSystem.readFile('settings.json');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.models) setModelConfigs(parsed.models);
        if (parsed.tools) setToolConfigs(parsed.tools);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const handleModelChange = (index: number, field: keyof ModelConfig, value: string) => {
    const newConfigs = [...modelConfigs];
    // @ts-ignore
    newConfigs[index][field] = value;
    setModelConfigs(newConfigs);
    setIsSaved(false);
  };

  const toggleTool = (id: string) => {
    setToolConfigs(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    setIsSaved(false);
  };
  
  const toggleToolApproval = (id: string) => {
    setToolConfigs(prev => prev.map(t => t.id === id ? { ...t, requiresApproval: !t.requiresApproval } : t));
    setIsSaved(false);
  };

  const saveSettings = () => {
    const settings = { models: modelConfigs, tools: toolConfigs };
    fileSystem.writeFile('settings.json', JSON.stringify(settings, null, 2));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const getIcon = (type: string) => {
    if (type.includes('Strategic')) return <Brain size={18} className="text-purple-500" />;
    if (type.includes('Coding')) return <Code size={18} className="text-blue-500" />;
    if (type.includes('Research')) return <Database size={18} className="text-green-500" />;
    if (type.includes('Creative')) return <PenTool size={18} className="text-pink-500" />;
    return <Cpu size={18} className="text-gray-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">System Configuration</h2>
          <p className="text-gray-400 text-sm">Manage agent brains, muscles, and tools.</p>
        </div>
        <button 
          onClick={saveSettings}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg ${
            isSaved 
              ? 'bg-green-500 text-white' 
              : 'bg-neon-blue text-white hover:bg-blue-600 shadow-blue-900/20'
          }`}
        >
          <Save size={18} />
          {isSaved ? 'Saved!' : 'Save Config'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 mb-6">
        <button 
            onClick={() => setActiveTab('models')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'models' ? 'border-neon-blue text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
            Brains & Muscles
        </button>
        <button 
            onClick={() => setActiveTab('tools')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'tools' ? 'border-neon-blue text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
            Tools & Permissions
        </button>
      </div>

      {activeTab === 'models' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-950 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">Task Domain</div>
            <div className="col-span-4">Primary Model</div>
            <div className="col-span-4">Fallback Model</div>
            </div>

            <div className="divide-y divide-gray-800">
            {modelConfigs.map((config, index) => (
                <div key={index} className="grid grid-cols-12 gap-6 px-6 py-6 items-center hover:bg-gray-800/30 transition-colors">
                
                <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 shadow-sm">
                    {getIcon(config.taskType)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-200">{config.taskType}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Automated Workflows</div>
                    </div>
                </div>

                <div className="col-span-4">
                    <select 
                    value={config.selectedModel}
                    onChange={(e) => handleModelChange(index, 'selectedModel', e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                    >
                    <option>Claude 3 Opus</option>
                    <option>Claude 3.5 Sonnet</option>
                    <option>GPT-4</option>
                    <option>GPT-4-Turbo</option>
                    <option>Gemini 1.5 Pro</option>
                    <option>Perplexity Online</option>
                    <option>Local Llama 3</option>
                    </select>
                </div>

                <div className="col-span-4">
                    <select 
                    value={config.fallbackModel}
                    onChange={(e) => handleModelChange(index, 'fallbackModel', e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 text-gray-400 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-500"
                    >
                    <option value="">None</option>
                    <option>GPT-3.5 Turbo</option>
                    <option>Gemini 1.5 Flash</option>
                    <option>CodeLlama 70B</option>
                    <option>Mistral Medium</option>
                    </select>
                </div>

                </div>
            ))}
            </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg flex gap-3 text-amber-500 text-sm">
                <ShieldAlert className="shrink-0" size={20} />
                <p>Disabling tools here acts as a "hard kill switch". Agents will receive a permission error if they attempt to use a disabled tool.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {toolConfigs.map(tool => (
                    <div key={tool.id} className={`p-4 border rounded-xl flex items-center justify-between transition-all ${
                        tool.enabled ? 'bg-gray-900 border-gray-800' : 'bg-gray-950 border-gray-800 opacity-60'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tool.riskLevel === 'critical' ? 'bg-red-900/20 text-red-500' : 
                                tool.riskLevel === 'moderate' ? 'bg-amber-900/20 text-amber-500' : 
                                'bg-blue-900/20 text-blue-500'
                            }`}>
                                <Wrench size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-200">{tool.name}</h3>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                         tool.riskLevel === 'critical' ? 'bg-red-500/10 text-red-500' : 
                                         tool.riskLevel === 'moderate' ? 'bg-amber-500/10 text-amber-500' : 
                                         'bg-blue-500/10 text-blue-500'
                                    }`}>{tool.riskLevel} Risk</span>
                                </div>
                                <p className="text-gray-500 text-sm">{tool.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    tool.requiresApproval ? 'bg-neon-blue border-neon-blue text-black' : 'border-gray-600 bg-transparent'
                                }`}>
                                    {tool.requiresApproval && <Shield size={12} />}
                                    <input type="checkbox" className="hidden" checked={tool.requiresApproval} onChange={() => toggleToolApproval(tool.id)} />
                                </div>
                                <span className="text-sm text-gray-400 group-hover:text-gray-300 select-none">Require Approval</span>
                            </label>

                            <div className="h-8 w-px bg-gray-800"></div>

                            <button 
                                onClick={() => toggleTool(tool.id)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                                    tool.enabled ? 'bg-neon-green' : 'bg-gray-700'
                                }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                                    tool.enabled ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;