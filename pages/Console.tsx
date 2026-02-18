import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, Trash2, ArrowRight } from 'lucide-react';
import { fileSystem } from '../lib/fileSystem';
import { ChatMessage } from '../types';

const Console: React.FC = () => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    const saved = fileSystem.readFile('console_history.json');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

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

    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setInput('');
    setIsProcessing(true);

    // Persist
    fileSystem.writeFile('console_history.json', JSON.stringify(newHistory));

    // Simulate Agent Response Delay
    setTimeout(() => {
        const agentMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            agentName: 'Muddy (Orchestrator)',
            text: generateMockResponse(userMsg.text),
            timestamp: new Date().toLocaleTimeString()
        };
        const updatedHistory = [...newHistory, agentMsg];
        setHistory(updatedHistory);
        setIsProcessing(false);
        fileSystem.writeFile('console_history.json', JSON.stringify(updatedHistory));
    }, 1500);
  };

  const clearHistory = () => {
      setHistory([]);
      fileSystem.writeFile('console_history.json', JSON.stringify([]));
  };

  const generateMockResponse = (input: string): string => {
      const lower = input.toLowerCase();
      if (lower.includes('status')) return "All systems operational. CPU load at 34%. 12 active threads running.";
      if (lower.includes('deploy')) return "Initiating deployment sequence for OpenCLAW v1.2...\n> git pull origin main\n> npm install\n> build successful.\nWaiting for final confirmation in Approvals queue.";
      if (lower.includes('error')) return "Scanning logs for errors...\nFound 1 critical error in 'memory_sync.ts': Heap out of memory. Recommendation: Increase node memory limit.";
      return "Acknowledged. Adding this task to the backlog for deeper analysis. I'll report back once the research agent completes the sweep.";
  };

  return (
    <div className="flex flex-col h-screen max-h-[calc(100vh-2rem)] rounded-xl border border-gray-800 bg-gray-950 mx-6 my-4 font-mono text-sm overflow-hidden shadow-2xl">
        {/* Terminal Header */}
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
                    <span>root@openclaw-mission-control:~</span>
                </div>
            </div>
            <button onClick={clearHistory} className="text-xs text-gray-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                <Trash2 size={12} /> Clear Buffer
            </button>
        </div>

        {/* Output Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {history.length === 0 && (
                <div className="text-gray-600 text-center mt-20">
                    <Cpu size={48} className="mx-auto mb-4 opacity-20" />
                    <p>OpenCLAW Command Interface Ready.</p>
                    <p className="text-xs mt-2">Type a command to interact with the agent fleet.</p>
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
                        : 'bg-black border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    }`}>
                        <div className="flex justify-between items-baseline mb-1 gap-4">
                            <span className="text-[10px] font-bold uppercase opacity-70">
                                {msg.sender === 'user' ? 'COMMAND' : msg.agentName || 'SYSTEM'}
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
                    <div className="flex items-center gap-1 text-neon-green h-10 px-2">
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce"></div>
                    </div>
                 </div>
            )}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
            <form onSubmit={handleSend} className="relative flex items-center">
                <div className="absolute left-4 text-neon-green animate-pulse">❯</div>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter command or message..."
                    className="w-full bg-black border border-gray-700 text-gray-100 font-mono text-sm rounded-md py-3 pl-8 pr-12 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green/50 placeholder-gray-700 transition-all"
                    autoFocus
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-2 p-1.5 bg-gray-800 text-gray-400 rounded hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    </div>
  );
};

export default Console;