import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';

const Console: React.FC = () => {
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    // Load from sessionStorage for persistence within session
    const saved = sessionStorage.getItem('console_history');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Save to sessionStorage whenever history changes
    sessionStorage.setItem('console_history', JSON.stringify(history.slice(-100))); // Keep last 100
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setError(null);

    try {
      // Try to create a real agent session via API
      const res = await fetch('/api/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: input, label: 'Console Agent' })
      });

      if (res.ok) {
        const data = await res.json();
        const agentMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          agentName: 'Spawned Agent',
          text: `Spawned agent session: ${data.sessionKey || 'success'}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setHistory(prev => [...prev, agentMsg]);
      } else {
        // Fallback: show helpful info about OpenClaw
        const agentMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          agentName: 'System',
          text: generateHelpResponse(input),
          timestamp: new Date().toLocaleTimeString()
        };
        setHistory(prev => [...prev, agentMsg]);
      }
    } catch (e) {
      setError('Failed to spawn agent');
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        agentName: 'System',
        text: generateHelpResponse(input),
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory(prev => [...prev, agentMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem('console_history');
  };

  const generateHelpResponse = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('status') || lower.includes('health')) {
      return `System Status:\n- Mission Control: Online\n- Dashboard: Connected to OpenClaw APIs\n- Cron Jobs: Active (see Dashboard)\n- Sessions: Check Agent Fleet tab`;
    }
    if (lower.includes('task') || lower.includes('todo')) {
      return `Task commands:\n- Go to Kanban tab to manage tasks\n- Tasks are synced with OpenClaw tasks.json\n- Drag and drop to change status`;
    }
    if (lower.includes('memory') || lower.includes('file')) {
      return `Memory commands:\n- Go to Memory tab to browse files\n- Memory files stored in workspace/memory/\n- Editable with live preview`;
    }
    if (lower.includes('help') || lower.includes('?')) {
      return `Available commands:\n- status: System health\n- tasks: Go to Kanban\n- memory: Browse files\n- sessions: View Agent Fleet\n- clear: Clear console`;
    }
    if (lower.includes('clear')) {
      clearHistory();
      return 'Console cleared.';
    }
    return `Command received: "${input}"\n\nUse the sidebar tabs to:\n• Dashboard - System overview and cron jobs\n• Tasks - Kanban board\n• Memory - File browser\n• Agent Fleet - Active sessions`;
  };

  return (
    <div className="flex flex-col h-screen max-h-[calc(100vh-2rem)] rounded-xl border border-gray-800 bg-gray-950 mx-6 my-4 font-mono text-sm overflow-hidden shadow-2xl">
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
          <div className="h-4 w-px bg-gray-800 mx-2"></div>
          <div className="text-gray-400 flex items-center gap-2 text-xs">
            <Terminal size={14} />
            <span>openclaw-console</span>
          </div>
        </div>
        <button onClick={clearHistory} className="text-xs text-gray-600 hover:text-red-400 flex items-center gap-1">
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-950/30 border-b border-red-900/50 flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
        {history.length === 0 && (
          <div className="text-gray-600 text-center mt-20">
            <Cpu size={48} className="mx-auto mb-4 opacity-20" />
            <p>Mission Control Console Ready.</p>
            <p className="text-xs mt-2 text-gray-700">Type 'help' for commands</p>
          </div>
        )}
        
        {history.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'agent' && (
              <div className="w-8 h-8 rounded bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                <Cpu size={16} />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg p-3 border ${
              msg.sender === 'user' 
                ? 'bg-gray-900 border-gray-800 text-gray-200' 
                : 'bg-black border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
            }`}>
              <div className="flex justify-between items-baseline mb-1 gap-4">
                <span className="text-[10px] font-bold uppercase opacity-70">
                  {msg.sender === 'user' ? 'YOU' : msg.agentName || 'SYSTEM'}
                </span>
                <span className="text-[10px] opacity-40">{msg.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center shrink-0 text-gray-400">
                <ArrowRight size={16} />
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
              <Cpu size={16} />
            </div>
            <div className="flex items-center gap-1 text-green-400 h-10 px-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '-0.3s'}}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '-0.15s'}}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSend} className="relative flex items-center">
          <div className="absolute left-4 text-green-400">❯</div>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Enter command..." 
            className="w-full bg-black border border-gray-700 text-gray-100 font-mono text-sm rounded-md py-3 pl-8 pr-12 focus:outline-none focus:border-green-400 placeholder-gray-700" 
            autoFocus 
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isProcessing} 
            className="absolute right-2 p-1.5 bg-gray-800 text-gray-400 rounded hover:text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Console;
